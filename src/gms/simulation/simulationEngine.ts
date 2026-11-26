import {
    Connection,
    GameMechanicSchema,
    GateConditionOperator,
    GateConfig,
    GateOutcome,
    IOProcessUnit,
    Unit,
} from '../schema/types'
import {
    FlowReading,
    IoProcessRuntimeState,
    SimulationState,
    StorageRuntimeState,
    UnitRuntimeState,
    isIoProcessRuntimeState,
} from './simulationTypes'

export function createInitialSimulationState(schema: GameMechanicSchema): SimulationState {
    const units: SimulationState['units'] = {}
    for (const unit of schema.units) {
        units[unit.id] =
            unit.type === 'ioProcess'
                ? {
                      inputBuffers: {},
                      outputBuffers: {},
                      cycleProgressSeconds: 0,
                      liveWorkerCount: unit.properties.workerCount,
                  }
                : { stock: {}, liveHaulerCount: unit.properties.haulerCount }
    }

    const gates: SimulationState['gates'] = {}
    const flows: SimulationState['flows'] = {}
    for (const connection of schema.connections) {
        if (connection.gate?.kind === 'interactive') {
            gates[connection.id] = { isOpen: connection.gate.isOpen }
        } else if (connection.gate?.kind === 'automatic') {
            gates[connection.id] = { timerSeconds: 0 }
        }
        flows[connection.id] = { resource: null, amount: 0 }
    }

    return { elapsedSeconds: 0, units, gates, flows }
}

function cloneUnits(units: SimulationState['units']): SimulationState['units'] {
    const result: SimulationState['units'] = {}
    for (const [id, runtime] of Object.entries(units)) {
        result[id] = isIoProcessRuntimeState(runtime)
            ? {
                  inputBuffers: { ...runtime.inputBuffers },
                  outputBuffers: { ...runtime.outputBuffers },
                  cycleProgressSeconds: runtime.cycleProgressSeconds,
                  liveWorkerCount: runtime.liveWorkerCount,
              }
            : { stock: { ...runtime.stock }, liveHaulerCount: runtime.liveHaulerCount }
    }
    return result
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}

function sumValues(record: Record<string, number>): number {
    return Object.values(record).reduce((sum, value) => sum + value, 0)
}

/** How much of `resource` is sitting at this unit, ready to flow out: the output
 *  buffer for an `ioProcess` unit, or current stock for a `storage` unit. */
function getAvailable(runtime: UnitRuntimeState, resource: string): number {
    return isIoProcessRuntimeState(runtime) ? (runtime.outputBuffers[resource] ?? 0) : (runtime.stock[resource] ?? 0)
}

function removeAvailable(runtime: UnitRuntimeState, resource: string, amount: number): void {
    if (isIoProcessRuntimeState(runtime)) {
        runtime.outputBuffers[resource] = (runtime.outputBuffers[resource] ?? 0) - amount
    } else {
        runtime.stock[resource] = (runtime.stock[resource] ?? 0) - amount
    }
}

/** Adds `amount` of `resource` into the unit without any capacity check — callers
 *  resolve storage capacity/overflow before calling this. */
function addRaw(runtime: UnitRuntimeState, resource: string, amount: number): void {
    if (isIoProcessRuntimeState(runtime)) {
        runtime.inputBuffers[resource] = (runtime.inputBuffers[resource] ?? 0) + amount
    } else {
        runtime.stock[resource] = (runtime.stock[resource] ?? 0) + amount
    }
}

function pickWeightedOutcome(outcomes: GateOutcome[], rng: () => number): string | null {
    const valid = outcomes.filter((outcome) => outcome.resource.trim() && outcome.weight > 0)
    const totalWeight = valid.reduce((sum, outcome) => sum + outcome.weight, 0)
    if (totalWeight <= 0) return null
    let roll = rng() * totalWeight
    for (const outcome of valid) {
        roll -= outcome.weight
        if (roll <= 0) return outcome.resource.trim()
    }
    return valid[valid.length - 1].resource.trim()
}

function advanceProduction(unit: IOProcessUnit, runtime: IoProcessRuntimeState, dtSeconds: number): void {
    const props = unit.properties
    if (props.cycleTimeSeconds <= 0) return

    // Fewer workers than the recipe calls for proportionally slows the cycle; zero
    // workers fully stalls it rather than running at a floor rate.
    const rateMultiplier = props.workerCount > 0 ? clamp(runtime.liveWorkerCount / props.workerCount, 0, 1) : 0
    runtime.cycleProgressSeconds = Math.min(
        props.cycleTimeSeconds,
        runtime.cycleProgressSeconds + dtSeconds * rateMultiplier,
    )

    if (runtime.cycleProgressSeconds < props.cycleTimeSeconds) return

    const hasAllInputs = props.inputs.every((input) => (runtime.inputBuffers[input.resource] ?? 0) >= input.amount)
    if (!hasAllInputs) return // stalled waiting on inputs; progress stays pinned at the threshold

    for (const input of props.inputs) {
        runtime.inputBuffers[input.resource] = (runtime.inputBuffers[input.resource] ?? 0) - input.amount
    }
    for (const output of props.outputs) {
        runtime.outputBuffers[output.resource] = (runtime.outputBuffers[output.resource] ?? 0) + output.amount
    }
    runtime.cycleProgressSeconds = 0
}

interface GateDelivery {
    resource: string
    amount: number
}

/** Resolves what a gated connection actually delivers this tick. Mutates `gates`
 *  in place (immutably — replacing only the touched entry) for the automatic kind's
 *  own timer. Returns null when nothing is delivered this tick. */
function resolveGateDelivery(
    gate: GateConfig,
    connectionId: string,
    sourceResource: string,
    available: number,
    conditionLookup: (resource: string) => number,
    gates: SimulationState['gates'],
    dtSeconds: number,
    rng: () => number,
): GateDelivery | null {
    switch (gate.kind) {
        case 'interactive': {
            const isOpen = gates[connectionId]?.isOpen ?? gate.isOpen
            return isOpen && available > 0 ? { resource: sourceResource, amount: available } : null
        }
        case 'random': {
            if (available <= 0) return null
            const resource = pickWeightedOutcome(gate.outcomes, rng)
            return resource ? { resource, amount: available } : null
        }
        case 'deterministic': {
            if (available <= 0) return null
            const conditionValue = conditionLookup(gate.conditionResource)
            const matches = compare(conditionValue, gate.operator, gate.threshold)
            const resource = (matches ? gate.thenResource : gate.elseResource).trim()
            return resource ? { resource, amount: available } : null
        }
        case 'automatic': {
            const previousTimer = gates[connectionId]?.timerSeconds ?? 0
            const nextTimer = previousTimer + dtSeconds
            if (nextTimer < gate.intervalSeconds) {
                gates[connectionId] = { ...gates[connectionId], timerSeconds: nextTimer }
                return null
            }
            gates[connectionId] = { ...gates[connectionId], timerSeconds: nextTimer - gate.intervalSeconds }
            if (available <= 0) return null
            const resource = pickWeightedOutcome(gate.outcomes, rng)
            return resource ? { resource, amount: available } : null
        }
    }
}

function compare(value: number, operator: GateConditionOperator, threshold: number): boolean {
    switch (operator) {
        case '>':
            return value > threshold
        case '>=':
            return value >= threshold
        case '<':
            return value < threshold
        case '<=':
            return value <= threshold
        case '==':
            return value === threshold
    }
}

export function stepSimulation(
    schema: GameMechanicSchema,
    state: SimulationState,
    dtSeconds: number,
    rng: () => number = Math.random,
): SimulationState {
    const units = cloneUnits(state.units)
    const gates: SimulationState['gates'] = { ...state.gates }
    const flows: SimulationState['flows'] = {}
    const unitsById = new Map(schema.units.map((unit) => [unit.id, unit]))

    for (const unit of schema.units) {
        if (unit.type !== 'ioProcess') continue
        advanceProduction(unit, units[unit.id] as IoProcessRuntimeState, dtSeconds)
    }

    for (const connection of schema.connections) {
        flows[connection.id] = resolveTransfer(connection, unitsById, units, gates, dtSeconds, rng)
    }

    return { elapsedSeconds: state.elapsedSeconds + dtSeconds, units, gates, flows }
}

function resolveTransfer(
    connection: Connection,
    unitsById: Map<string, Unit>,
    units: SimulationState['units'],
    gates: SimulationState['gates'],
    dtSeconds: number,
    rng: () => number,
): FlowReading {
    const mapping = connection.resourceMapping
    const sourceResource = mapping?.sourceResource.trim()
    const sourceUnit = unitsById.get(connection.sourceShapeId)
    const targetUnit = unitsById.get(connection.targetShapeId)
    if (!mapping || !sourceResource || !sourceUnit || !targetUnit) {
        return { resource: null, amount: 0 }
    }

    const sourceRuntime = units[sourceUnit.id]
    const available = getAvailable(sourceRuntime, sourceResource)

    const delivery = connection.gate
        ? resolveGateDelivery(
              connection.gate,
              connection.id,
              sourceResource,
              available,
              (resource) => getAvailable(sourceRuntime, resource),
              gates,
              dtSeconds,
              rng,
          )
        : available > 0
          ? { resource: mapping.targetResource.trim() || sourceResource, amount: available }
          : null

    if (!delivery || delivery.amount <= 0) {
        return { resource: null, amount: 0 }
    }

    const targetRuntime = units[targetUnit.id]
    let removedFromSource = delivery.amount
    let addedToTarget = delivery.amount

    if (targetUnit.type === 'storage' && !targetUnit.properties.capacity.isInfinite) {
        const storageRuntime = targetRuntime as StorageRuntimeState
        const room = Math.max(0, targetUnit.properties.capacity.maxUnits - sumValues(storageRuntime.stock))
        const accepted = Math.min(delivery.amount, room)
        addedToTarget = accepted
        // haltProduction backs the surplus up at the source instead of discarding it;
        // spillWaste/autoSellSurplus both let the source release it all and just drop
        // whatever doesn't fit.
        removedFromSource = targetUnit.properties.overflowRule === 'haltProduction' ? accepted : delivery.amount
    }

    removeAvailable(sourceRuntime, sourceResource, removedFromSource)
    if (addedToTarget > 0) {
        addRaw(targetRuntime, delivery.resource, addedToTarget)
    }

    return { resource: addedToTarget > 0 ? delivery.resource : null, amount: addedToTarget }
}
