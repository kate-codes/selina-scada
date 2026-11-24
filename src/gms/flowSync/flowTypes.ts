import { Edge, Node } from '@xyflow/react'
import { ConnectionResourceMapping, Unit } from '../schema/types'

export interface UnitNodeData extends Record<string, unknown> {
    unit: Unit
}
export type UnitFlowNode = Node<UnitNodeData, 'unit'>

export interface ConnectionEdgeData extends Record<string, unknown> {
    mapping: ConnectionResourceMapping | null
}
export type ConnectionFlowEdge = Edge<ConnectionEdgeData>
