import React from 'react'
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from '@xyflow/react'
import { ConnectionFlowEdge } from '../flowSync/flowTypes'
import { EDGE_IDLE_COLOR, EDGE_SELECTED_COLOR } from '../constants'

const ConnectionEdge: React.FC<EdgeProps<ConnectionFlowEdge>> = ({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    markerEnd,
    data,
    selected,
}) => {
    // midX/midY are the actual computed midpoint of the stepped path, not a linear
    // interpolation between source and target, so the label lands on the line itself
    // even where the path bends around a right angle.
    const [path, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 12,
    })

    const sourceResource = data?.mapping?.sourceResource?.trim()
    const stroke = selected ? EDGE_SELECTED_COLOR : EDGE_IDLE_COLOR

    return (
        <>
            <BaseEdge path={path} markerEnd={markerEnd} style={{ stroke, strokeWidth: selected ? 3 : 2 }} />
            {sourceResource && (
                <EdgeLabelRenderer>
                    <div
                        className="gms-edge-label"
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        }}
                    >
                        {sourceResource}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    )
}

export default ConnectionEdge
