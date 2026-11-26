import { describe, expect, it } from 'vitest'
import { createDefaultIOProcessProperties, createDefaultStorageProperties, createEmptySchema } from '../schema/defaults'
import {
    Connection,
    GameMechanicSchema,
    IOProcessUnit,
    IOProcessUnitProperties,
    StorageUnit,
    StorageUnitProperties,
} from '../schema/types'
import { createInitialSimulationState, stepSimulation } from './simulationEngine'
import { IoProcessRuntimeState, StorageRuntimeState } from './simulationTypes'

function makeIoUnit(id: string, overrides: Partial<IOProcessUnitProperties> = {}): IOProcessUnit {
    return {
        id,
        type: 'ioProcess',
        name: `IO ${id}`,
        position: { x: 0, y: 0 },
        properties: { ...createDefaultIOProcessProperties(), ...overrides },
    }
}

// Infinite capacity by default so flow/gate tests aren't incidentally blocked by the
// schema default of maxUnits: 0 — capacity tests override this explicitly.
function makeStorageUnit(id: string, overrides: Partial<StorageUnitProperties> = {}): StorageUnit {
    return {
        id,
        type: 'storage',
        name: `Storage ${id}`,
        position: { x: 0, y: 0 },
        properties: { ...createDefaultStorageProperties(), capacity: { isInfinite: true, maxUnits: 0 }, ...overrides },
    }
}

function makeConnection(
    id: string,
    sourceShapeId: string,
    targetShapeId: string,
    overrides: Partial<Connection> = {},
): Connection {
    return {
        id,
        sourceShapeId,
        sourceAnchor: 'right',
        targetShapeId,
        targetAnchor: 'left',
        resourceMapping: { sourceResource: 'Ore', targetResource: 'Ore' },
        gate: null,
        ...overrides,
    }
}

function makeSchema(units: GameMechanicSchema['units'], connections: Connection[]): GameMechanicSchema {
    return { ...createEmptySchema(), units, connections }
}

describe('stepSimulation production', () => {
    it('accumulates cycle progress and produces output once the cycle completes', () => {
        const mine = makeIoUnit('mine', {
            cycleTimeSeconds: 2,
            outputs: [{ resource: 'Ore', amount: 5 }],
            workerCount: 1,
        })
        const schema = makeSchema([mine], [])
        let state = createInitialSimulationState(schema)

        state = stepSimulation(schema, state, 1)
        expect((state.units.mine as IoProcessRuntimeState).cycleProgressSeconds).toBe(1)
        expect((state.units.mine as IoProcessRuntimeState).outputBuffers.Ore).toBeUndefined()

        state = stepSimulation(schema, state, 1)
        expect((state.units.mine as IoProcessRuntimeState).cycleProgressSeconds).toBe(0)
        expect((state.units.mine as IoProcessRuntimeState).outputBuffers.Ore).toBe(5)
    })

    it('fully stalls once live worker count drops to zero', () => {
        const mine = makeIoUnit('mine', {
            cycleTimeSeconds: 2,
            outputs: [{ resource: 'Ore', amount: 5 }],
            workerCount: 2,
        })
        const schema = makeSchema([mine], [])
        let state = createInitialSimulationState(schema)
        state = {
            ...state,
            units: { ...state.units, mine: { ...(state.units.mine as IoProcessRuntimeState), liveWorkerCount: 0 } },
        }

        state = stepSimulation(schema, state, 5)
        expect((state.units.mine as IoProcessRuntimeState).cycleProgressSeconds).toBe(0)
    })

    it('runs at half speed with half the configured workers', () => {
        const mine = makeIoUnit('mine', {
            cycleTimeSeconds: 4,
            outputs: [{ resource: 'Ore', amount: 1 }],
            workerCount: 2,
        })
        const schema = makeSchema([mine], [])
        let state = createInitialSimulationState(schema)
        state = {
            ...state,
            units: { ...state.units, mine: { ...(state.units.mine as IoProcessRuntimeState), liveWorkerCount: 1 } },
        }

        state = stepSimulation(schema, state, 2)
        expect((state.units.mine as IoProcessRuntimeState).cycleProgressSeconds).toBe(1)
    })

    it('stalls at the cycle threshold when required inputs are unavailable', () => {
        const factory = makeIoUnit('factory', {
            cycleTimeSeconds: 1,
            inputs: [{ resource: 'Ore', amount: 10 }],
            outputs: [{ resource: 'Ingot', amount: 1 }],
            workerCount: 1,
        })
        const schema = makeSchema([factory], [])
        let state = createInitialSimulationState(schema)

        state = stepSimulation(schema, state, 1)
        expect((state.units.factory as IoProcessRuntimeState).cycleProgressSeconds).toBe(1)
        expect((state.units.factory as IoProcessRuntimeState).outputBuffers.Ingot).toBeUndefined()
    })
})

describe('stepSimulation transfer (plain linker)', () => {
    it('moves produced output into the target storage stock in the same tick', () => {
        const mine = makeIoUnit('mine', { cycleTimeSeconds: 1, outputs: [{ resource: 'Ore', amount: 5 }], workerCount: 1 })
        const warehouse = makeStorageUnit('warehouse')
        const connection = makeConnection('c1', 'mine', 'warehouse')
        const schema = makeSchema([mine, warehouse], [connection])
        let state = createInitialSimulationState(schema)

        state = stepSimulation(schema, state, 1)

        expect((state.units.warehouse as StorageRuntimeState).stock.Ore).toBe(5)
        expect((state.units.mine as IoProcessRuntimeState).outputBuffers.Ore ?? 0).toBe(0)
        expect(state.flows.c1).toEqual({ resource: 'Ore', amount: 5 })
    })
})

describe('stepSimulation gates: interactive', () => {
    it('passes the resource through unchanged when open', () => {
        const mine = makeIoUnit('mine', { cycleTimeSeconds: 1, outputs: [{ resource: 'Ore', amount: 5 }], workerCount: 1 })
        const warehouse = makeStorageUnit('warehouse')
        const connection = makeConnection('c1', 'mine', 'warehouse', { gate: { kind: 'interactive', isOpen: true } })
        const schema = makeSchema([mine, warehouse], [connection])
        let state = createInitialSimulationState(schema)

        state = stepSimulation(schema, state, 1)

        expect((state.units.warehouse as StorageRuntimeState).stock.Ore).toBe(5)
    })

    it('blocks the resource when closed, leaving it queued at the source', () => {
        const mine = makeIoUnit('mine', { cycleTimeSeconds: 1, outputs: [{ resource: 'Ore', amount: 5 }], workerCount: 1 })
        const warehouse = makeStorageUnit('warehouse')
        const connection = makeConnection('c1', 'mine', 'warehouse', { gate: { kind: 'interactive', isOpen: false } })
        const schema = makeSchema([mine, warehouse], [connection])
        let state = createInitialSimulationState(schema)

        state = stepSimulation(schema, state, 1)

        expect((state.units.warehouse as StorageRuntimeState).stock.Ore ?? 0).toBe(0)
        expect((state.units.mine as IoProcessRuntimeState).outputBuffers.Ore).toBe(5)
        expect(state.flows.c1).toEqual({ resource: null, amount: 0 })
    })
})

describe('stepSimulation gates: random', () => {
    const outcomes = [
        { resource: 'Gold', weight: 1 },
        { resource: 'Silver', weight: 1 },
    ]

    it('delivers the first outcome on a low roll', () => {
        const mine = makeIoUnit('mine', { cycleTimeSeconds: 1, outputs: [{ resource: 'Ore', amount: 5 }], workerCount: 1 })
        const warehouse = makeStorageUnit('warehouse')
        const connection = makeConnection('c1', 'mine', 'warehouse', { gate: { kind: 'random', outcomes } })
        const schema = makeSchema([mine, warehouse], [connection])
        let state = createInitialSimulationState(schema)

        state = stepSimulation(schema, state, 1, () => 0)

        expect((state.units.warehouse as StorageRuntimeState).stock).toEqual({ Gold: 5 })
    })

    it('delivers the other outcome on a high roll', () => {
        const mine = makeIoUnit('mine', { cycleTimeSeconds: 1, outputs: [{ resource: 'Ore', amount: 5 }], workerCount: 1 })
        const warehouse = makeStorageUnit('warehouse')
        const connection = makeConnection('c1', 'mine', 'warehouse', { gate: { kind: 'random', outcomes } })
        const schema = makeSchema([mine, warehouse], [connection])
        let state = createInitialSimulationState(schema)

        state = stepSimulation(schema, state, 1, () => 0.9)

        expect((state.units.warehouse as StorageRuntimeState).stock).toEqual({ Silver: 5 })
    })
})

describe('stepSimulation gates: deterministic', () => {
    function makeMineWithGas(gasAmount: number): IOProcessUnit {
        return makeIoUnit('mine', {
            cycleTimeSeconds: 1,
            outputs: [
                { resource: 'Ore', amount: 5 },
                { resource: 'Gas', amount: gasAmount },
            ],
            workerCount: 1,
        })
    }

    it('delivers thenResource when the condition holds', () => {
        const mine = makeMineWithGas(20)
        const warehouse = makeStorageUnit('warehouse')
        const connection = makeConnection('c1', 'mine', 'warehouse', {
            gate: {
                kind: 'deterministic',
                conditionResource: 'Gas',
                operator: '>',
                threshold: 10,
                thenResource: 'RefinedOre',
                elseResource: 'RawOre',
            },
        })
        const schema = makeSchema([mine, warehouse], [connection])
        let state = createInitialSimulationState(schema)

        state = stepSimulation(schema, state, 1)

        expect((state.units.warehouse as StorageRuntimeState).stock).toEqual({ RefinedOre: 5 })
    })

    it('delivers elseResource when the condition fails', () => {
        const mine = makeMineWithGas(2)
        const warehouse = makeStorageUnit('warehouse')
        const connection = makeConnection('c1', 'mine', 'warehouse', {
            gate: {
                kind: 'deterministic',
                conditionResource: 'Gas',
                operator: '>',
                threshold: 10,
                thenResource: 'RefinedOre',
                elseResource: 'RawOre',
            },
        })
        const schema = makeSchema([mine, warehouse], [connection])
        let state = createInitialSimulationState(schema)

        state = stepSimulation(schema, state, 1)

        expect((state.units.warehouse as StorageRuntimeState).stock).toEqual({ RawOre: 5 })
    })
})

describe('stepSimulation gates: automatic', () => {
    it('does not deliver before its interval elapses', () => {
        const mine = makeIoUnit('mine', { cycleTimeSeconds: 1, outputs: [{ resource: 'Ore', amount: 5 }], workerCount: 1 })
        const warehouse = makeStorageUnit('warehouse')
        const connection = makeConnection('c1', 'mine', 'warehouse', {
            gate: { kind: 'automatic', intervalSeconds: 2, outcomes: [{ resource: 'Gold', weight: 1 }] },
        })
        const schema = makeSchema([mine, warehouse], [connection])
        let state = createInitialSimulationState(schema)

        state = stepSimulation(schema, state, 1, () => 0)

        expect((state.units.warehouse as StorageRuntimeState).stock.Gold).toBeUndefined()
        expect(state.gates.c1?.timerSeconds).toBeCloseTo(1)
    })

    it('delivers whatever is queued once its interval elapses, carrying any remainder', () => {
        const mine = makeIoUnit('mine', { cycleTimeSeconds: 1, outputs: [{ resource: 'Ore', amount: 5 }], workerCount: 1 })
        const warehouse = makeStorageUnit('warehouse')
        const connection = makeConnection('c1', 'mine', 'warehouse', {
            gate: { kind: 'automatic', intervalSeconds: 2, outcomes: [{ resource: 'Gold', weight: 1 }] },
        })
        const schema = makeSchema([mine, warehouse], [connection])
        let state = createInitialSimulationState(schema)

        state = stepSimulation(schema, state, 1, () => 0) // mine: +5 Ore buffered; gate timer 0 -> 1 (not fired)
        state = stepSimulation(schema, state, 1, () => 0) // mine: +5 more (10 buffered); gate timer 1 -> 2, fires

        expect((state.units.warehouse as StorageRuntimeState).stock.Gold).toBe(10)
        expect(state.gates.c1?.timerSeconds).toBeCloseTo(0)
    })
})

describe('stepSimulation storage capacity/overflow', () => {
    it('haltProduction backs the overflow up at the source instead of discarding it', () => {
        const mine = makeIoUnit('mine', { cycleTimeSeconds: 1, outputs: [{ resource: 'Ore', amount: 10 }], workerCount: 1 })
        const warehouse = makeStorageUnit('warehouse', {
            capacity: { isInfinite: false, maxUnits: 6 },
            overflowRule: 'haltProduction',
        })
        const connection = makeConnection('c1', 'mine', 'warehouse')
        const schema = makeSchema([mine, warehouse], [connection])
        let state = createInitialSimulationState(schema)

        state = stepSimulation(schema, state, 1)

        expect((state.units.warehouse as StorageRuntimeState).stock.Ore).toBe(6)
        expect((state.units.mine as IoProcessRuntimeState).outputBuffers.Ore).toBe(4)
    })

    it('spillWaste releases the full amount from the source and discards the overflow', () => {
        const mine = makeIoUnit('mine', { cycleTimeSeconds: 1, outputs: [{ resource: 'Ore', amount: 10 }], workerCount: 1 })
        const warehouse = makeStorageUnit('warehouse', {
            capacity: { isInfinite: false, maxUnits: 6 },
            overflowRule: 'spillWaste',
        })
        const connection = makeConnection('c1', 'mine', 'warehouse')
        const schema = makeSchema([mine, warehouse], [connection])
        let state = createInitialSimulationState(schema)

        state = stepSimulation(schema, state, 1)

        expect((state.units.warehouse as StorageRuntimeState).stock.Ore).toBe(6)
        expect((state.units.mine as IoProcessRuntimeState).outputBuffers.Ore ?? 0).toBe(0)
    })
})
