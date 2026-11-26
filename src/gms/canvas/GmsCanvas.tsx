import React, { useEffect, useMemo, useState } from 'react'
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
import { useSimulation } from '../simulation/useSimulation'
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
    activePopoverEdgeId: string | null
    isImportExportOpen: boolean
}

const GmsCanvas: React.FC<GmsCanvasProps> = ({
    onEditUnit,
    onEdgeClick,
    onOpenImportExport,
    onOpenNewUnit,
    activePopoverEdgeId,
    isImportExportOpen,
}) => {
    const { gms, dispatch } = useGmsStore()
    const simulation = useSimulation(gms)

    // Only worth offering Play once there's actually something to watch run.
    const showPlayToggle = gms.units.some(
        (unit) => unit.type === 'ioProcess' && unit.properties.outputs.length > 0 && unit.properties.cycleTimeSeconds > 0,
    )

    const [nodes, setNodes, onNodesChange] = useNodesState<UnitFlowNode>(toFlowNodes(gms.units))
    const [edges, setEdges, onEdgesChange] = useEdgesState<ConnectionFlowEdge>(toFlowEdges(gms.connections))
    const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)

    // Live stock/buffer readouts, re-merged every simulation tick — doesn't touch
    // nodeTypes identity (that stays stable below), just each node's own `data`, which
    // React Flow re-renders in place without remounting.
    const displayNodes = useMemo(
        () =>
            nodes.map((node) => ({
                ...node,
                data: {
                    unit: node.data.unit,
                    isPlaying: simulation.isPlaying,
                    runtime: simulation.simulationState.units[node.id] ?? null,
                },
            })),
        [nodes, simulation.simulationState, simulation.isPlaying],
    )

    // The inline delete "x" is a hover-only affordance, not tied to edge `selected` state —
    // selection also flips true just from opening the resource-mapping popover (a click
    // always both selects the edge and opens it), and selection can outlive the popover
    // being closed, which left an orphaned delete button sitting on the canvas. Hovering
    // away (or the popover being open for that edge) hides it instead. Also carries the
    // live flow reading and (for an interactive gate) the live open/closed override,
    // re-merged every simulation tick the same way as the node data above.
    const displayEdges = useMemo(
        () =>
            edges.map((edge) => {
                const isHovered = edge.id === hoveredEdgeId && edge.id !== activePopoverEdgeId
                return {
                    ...edge,
                    data: {
                        mapping: edge.data?.mapping ?? null,
                        gate: edge.data?.gate ?? null,
                        isHovered,
                        isPlaying: simulation.isPlaying,
                        flow: simulation.simulationState.flows[edge.id] ?? null,
                        liveGateOpen: simulation.simulationState.gates[edge.id]?.isOpen,
                    },
                }
            }),
        [edges, hoveredEdgeId, activePopoverEdgeId, simulation.simulationState, simulation.isPlaying],
    )

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
                    onWorkerCountChange={simulation.setLiveWorkerCount}
                    onHaulerCountChange={simulation.setLiveHaulerCount}
                />
            ),
        }),
        [onEditUnit, dispatch, simulation.setLiveWorkerCount, simulation.setLiveHaulerCount],
    )

    const edgeTypes = useMemo(
        () => ({
            connection: (props: EdgeProps<ConnectionFlowEdge>) => (
                <ConnectionEdge
                    {...props}
                    onDelete={(edgeId) => dispatch({ type: 'connection/remove', ids: [edgeId] })}
                    onGateToggle={(edgeId, nextGate) => {
                        // While playing, the toggle flips an ephemeral runtime copy instead
                        // of the saved design (see schema/types.ts's InteractiveGateConfig
                        // comment) — only when stopped does it edit the schema default.
                        if (simulation.isPlaying) {
                            if (nextGate.kind === 'interactive') simulation.setGateOpen(edgeId, nextGate.isOpen)
                            return
                        }
                        dispatch({ type: 'connection/setGate', id: edgeId, gate: nextGate })
                    }}
                />
            ),
        }),
        [dispatch, simulation.isPlaying, simulation.setGateOpen],
    )

    return (
        <ReactFlow<UnitFlowNode, ConnectionFlowEdge>
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeDragStop={(_event, node) => {
                dispatch({ type: 'unit/move', id: node.id, position: node.position })
            }}
            onNodesDelete={(deleted) => {
                if (simulation.isPlaying) return
                dispatch({ type: 'unit/remove', ids: deleted.map((node) => node.id) })
            }}
            onConnect={(connection) => {
                if (simulation.isPlaying) return
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
                        gate: null,
                    },
                })
            }}
            onEdgesDelete={(deleted) => {
                if (simulation.isPlaying) return
                dispatch({ type: 'connection/remove', ids: deleted.map((edge) => edge.id) })
            }}
            onMoveEnd={(_event, viewport) => {
                dispatch({ type: 'viewport/commit', viewport })
            }}
            onEdgeClick={(event, edge) => {
                if (simulation.isPlaying) return
                onEdgeClick(edge.id, { top: event.clientY, left: event.clientX })
            }}
            onEdgeMouseEnter={(_event, edge) => setHoveredEdgeId(edge.id)}
            onEdgeMouseLeave={() => setHoveredEdgeId(null)}
            connectionMode={ConnectionMode.Loose}
            connectionRadius={CONNECTION_RADIUS}
            connectionLineComponent={CustomConnectionLine}
            defaultEdgeOptions={{ type: 'connection' }}
            defaultViewport={gms.viewSettings.viewport}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            deleteKeyCode={simulation.isPlaying ? [] : ['Backspace', 'Delete']}
            proOptions={{ hideAttribution: true }}
        >
            <Background />
            <Controls />
            <CanvasToolbar
                schemaName={gms.name}
                onRenameSchema={(name) => dispatch({ type: 'schema/rename', name })}
                isNameEditable={!isImportExportOpen}
                onOpenImportExport={onOpenImportExport}
                onOpenNewUnit={onOpenNewUnit}
                showPlayToggle={showPlayToggle}
                isPlaying={simulation.isPlaying}
                onTogglePlay={simulation.togglePlay}
            />
        </ReactFlow>
    )
}

export default GmsCanvas
