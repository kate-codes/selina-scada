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
