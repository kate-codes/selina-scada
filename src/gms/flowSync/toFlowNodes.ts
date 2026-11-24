import { Unit } from '../schema/types'
import { UnitFlowNode } from './flowTypes'

export function toFlowNodes(units: Unit[]): UnitFlowNode[] {
    return units.map((unit) => ({
        id: unit.id,
        type: 'unit',
        position: unit.position,
        data: { unit },
    }))
}

/**
 * Merges fresh GMS units into the existing React Flow node array by id, preserving
 * each node's RF-owned fields (selected, measured dimensions) instead of replacing
 * the array wholesale, which would otherwise clear every other node's selection
 * and force a remeasure whenever a single unit changes.
 */
export function mergeUnitsIntoFlowNodes(previousNodes: UnitFlowNode[], units: Unit[]): UnitFlowNode[] {
    const previousById = new Map(previousNodes.map((node) => [node.id, node]))
    return units.map((unit) => {
        const previous = previousById.get(unit.id)
        if (!previous) {
            return { id: unit.id, type: 'unit', position: unit.position, data: { unit } }
        }
        return { ...previous, position: unit.position, data: { unit } }
    })
}
