import { Edge, Node } from '@xyflow/react'
import { ConnectionResourceMapping, GateConfig, Unit } from '../schema/types'
import { FlowReading, UnitRuntimeState } from '../simulation/simulationTypes'

export interface UnitNodeData extends Record<string, unknown> {
    unit: Unit
    /** True while the simulation is running; false (including "never started") is the
     *  normal static/editable view. Never persisted — see simulationTypes.ts. */
    isPlaying?: boolean
    /** This unit's live runtime snapshot, re-merged every simulation tick. */
    runtime?: UnitRuntimeState | null
}
export type UnitFlowNode = Node<UnitNodeData, 'unit'>

export interface ConnectionEdgeData extends Record<string, unknown> {
    mapping: ConnectionResourceMapping | null
    gate: GateConfig | null
    /** UI-local hover affordance for the inline delete button; never persisted to GMS. */
    isHovered?: boolean
    /** True while the simulation is running; see UnitNodeData.isPlaying. */
    isPlaying?: boolean
    /** This connection's last-tick flow reading, re-merged every simulation tick. */
    flow?: FlowReading | null
    /** Live open/closed override for an interactive gate; undefined for other kinds. */
    liveGateOpen?: boolean
}
export type ConnectionFlowEdge = Edge<ConnectionEdgeData>
