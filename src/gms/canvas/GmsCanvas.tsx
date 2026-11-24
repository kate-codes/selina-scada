import React, { useEffect, useMemo } from 'react'
import {
    Background,
    ConnectionMode,
    Controls,
    EdgeProps,
    NodeProps,
    ReactFlow,
    useEdgesState,
    useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/base.css'
import './gmsCanvas.css'
import { ANCHOR_POSITIONS, CONNECTION_RADIUS, MAX_ZOOM, MIN_ZOOM } from '../constants'
import { ConnectionFlowEdge, UnitFlowNode } from '../flowSync/flowTypes'
import { mergeConnectionsIntoFlowEdges, toFlowEdges } from '../flowSync/toFlowEdges'
import { mergeUnitsIntoFlowNodes, toFlowNodes } from '../flowSync/toFlowNodes'
import { createId } from '../schema/defaults'
import { AnchorPosition, Unit } from '../schema/types'
import { useGmsStore } from '../state/GmsContext'
import CanvasToolbar from './CanvasToolbar'
import ConnectionEdge from './ConnectionEdge'
import CustomConnectionLine from './CustomConnectionLine'
import UnitNode from './UnitNode'

function isAnchorPosition(value: string | null | undefined): value is AnchorPosition {
    return !!value && (ANCHOR_POSITIONS as string[]).includes(value)
}

interface GmsCanvasProps {
    onEditUnit: (unit: Unit) => void
    onEdgeClick: (edgeId: string, anchorPosition: { top: number; left: number }) => void
    onOpenImportExport: () => void
    onOpenNewUnit: () => void
}

const GmsCanvas: React.FC<GmsCanvasProps> = ({ onEditUnit, onEdgeClick, onOpenImportExport, onOpenNewUnit }) => {
    const { gms, dispatch } = useGmsStore()

    const [nodes, setNodes, onNodesChange] = useNodesState<UnitFlowNode>(toFlowNodes(gms.units))
    const [edges, setEdges, onEdgesChange] = useEdgesState<ConnectionFlowEdge>(toFlowEdges(gms.connections))

    // GMS -> Layer 1 resync (import, dialog create/update, etc). Merge by id rather
    // than replacing wholesale, so unrelated nodes keep their selection/measured state.
    useEffect(() => {
        setNodes((previous) => mergeUnitsIntoFlowNodes(previous, gms.units))
    }, [gms.units, setNodes])

    useEffect(() => {
        setEdges((previous) => mergeConnectionsIntoFlowEdges(previous, gms.connections))
    }, [gms.connections, setEdges])

    const nodeTypes = useMemo(
        () => ({
            unit: (props: NodeProps<UnitFlowNode>) => (
                <UnitNode
                    {...props}
                    onEdit={onEditUnit}
                    onDelete={(unit) => dispatch({ type: 'unit/remove', ids: [unit.id] })}
                />
            ),
        }),
        [onEditUnit, dispatch],
    )

    const edgeTypes = useMemo(
        () => ({
            connection: (props: EdgeProps<ConnectionFlowEdge>) => (
                <ConnectionEdge
                    {...props}
                    onDelete={(edgeId) => dispatch({ type: 'connection/remove', ids: [edgeId] })}
                />
            ),
        }),
        [dispatch],
    )

    return (
        <ReactFlow<UnitFlowNode, ConnectionFlowEdge>
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeDragStop={(_event, node) => {
                dispatch({ type: 'unit/move', id: node.id, position: node.position })
            }}
            onNodesDelete={(deleted) => {
                dispatch({ type: 'unit/remove', ids: deleted.map((node) => node.id) })
            }}
            onConnect={(connection) => {
                if (!isAnchorPosition(connection.sourceHandle) || !isAnchorPosition(connection.targetHandle)) return
                dispatch({
                    type: 'connection/add',
                    connection: {
                        id: createId('connection'),
                        sourceShapeId: connection.source,
                        sourceAnchor: connection.sourceHandle,
                        targetShapeId: connection.target,
                        targetAnchor: connection.targetHandle,
                        resourceMapping: null,
                    },
                })
            }}
            onEdgesDelete={(deleted) => {
                dispatch({ type: 'connection/remove', ids: deleted.map((edge) => edge.id) })
            }}
            onMoveEnd={(_event, viewport) => {
                dispatch({ type: 'viewport/commit', viewport })
            }}
            onEdgeClick={(event, edge) => {
                onEdgeClick(edge.id, { top: event.clientY, left: event.clientX })
            }}
            connectionMode={ConnectionMode.Loose}
            connectionRadius={CONNECTION_RADIUS}
            connectionLineComponent={CustomConnectionLine}
            defaultEdgeOptions={{ type: 'connection' }}
            defaultViewport={gms.viewSettings.viewport}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            deleteKeyCode={['Backspace', 'Delete']}
            proOptions={{ hideAttribution: true }}
        >
            <Background />
            <Controls />
            <CanvasToolbar onOpenImportExport={onOpenImportExport} onOpenNewUnit={onOpenNewUnit} />
        </ReactFlow>
    )
}

export default GmsCanvas
