import { describe, expect, it } from 'vitest'
import { createDefaultStorageProperties, createEmptySchema } from '../schema/defaults'
import { Connection, StorageUnit } from '../schema/types'
import { gmsReducer } from './gmsReducer'

function makeUnit(id: string): StorageUnit {
    return {
        id,
        type: 'storage',
        name: `Unit ${id}`,
        position: { x: 0, y: 0 },
        properties: createDefaultStorageProperties(),
    }
}

function makeConnection(id: string, sourceShapeId: string, targetShapeId: string): Connection {
    return {
        id,
        sourceShapeId,
        sourceAnchor: 'right',
        targetShapeId,
        targetAnchor: 'left',
        resourceMapping: null,
        gate: null,
    }
}

describe('gmsReducer unit/remove', () => {
    it('removes the targeted unit from state.units', () => {
        const state = {
            ...createEmptySchema(),
            units: [makeUnit('unit-1'), makeUnit('unit-2')],
        }

        const next = gmsReducer(state, { type: 'unit/remove', ids: ['unit-1'] })

        expect(next.units.map((unit) => unit.id)).toEqual(['unit-2'])
    })

    it('also removes connections attached to the deleted unit, in either direction', () => {
        const state = {
            ...createEmptySchema(),
            units: [makeUnit('unit-1'), makeUnit('unit-2'), makeUnit('unit-3')],
            connections: [
                makeConnection('conn-source', 'unit-1', 'unit-3'),
                makeConnection('conn-target', 'unit-2', 'unit-1'),
                makeConnection('conn-unrelated', 'unit-2', 'unit-3'),
            ],
        }

        const next = gmsReducer(state, { type: 'unit/remove', ids: ['unit-1'] })

        expect(next.connections.map((connection) => connection.id)).toEqual(['conn-unrelated'])
    })

    it('leaves other units and connections untouched', () => {
        const state = {
            ...createEmptySchema(),
            units: [makeUnit('unit-1'), makeUnit('unit-2')],
            connections: [makeConnection('conn-unrelated', 'unit-2', 'unit-2')],
        }

        const next = gmsReducer(state, { type: 'unit/remove', ids: ['unit-1'] })

        expect(next.units).toEqual([makeUnit('unit-2')])
        expect(next.connections).toEqual(state.connections)
    })
})

describe('gmsReducer connection/setGate', () => {
    it('sets a gate config on the targeted connection, leaving others untouched', () => {
        const state = {
            ...createEmptySchema(),
            units: [makeUnit('unit-1'), makeUnit('unit-2')],
            connections: [makeConnection('conn-1', 'unit-1', 'unit-2'), makeConnection('conn-2', 'unit-1', 'unit-2')],
        }
        const gate: Connection['gate'] = { kind: 'interactive', isOpen: true }

        const next = gmsReducer(state, { type: 'connection/setGate', id: 'conn-1', gate })

        expect(next.connections.find((c) => c.id === 'conn-1')?.gate).toEqual(gate)
        expect(next.connections.find((c) => c.id === 'conn-2')?.gate).toBeNull()
    })

    it('clears a gate back to null', () => {
        const state = {
            ...createEmptySchema(),
            units: [makeUnit('unit-1'), makeUnit('unit-2')],
            connections: [
                { ...makeConnection('conn-1', 'unit-1', 'unit-2'), gate: { kind: 'interactive', isOpen: true } } as Connection,
            ],
        }

        const next = gmsReducer(state, { type: 'connection/setGate', id: 'conn-1', gate: null })

        expect(next.connections[0].gate).toBeNull()
    })
})
