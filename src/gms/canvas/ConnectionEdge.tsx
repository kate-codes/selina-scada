import React from 'react'
import { BaseEdge, EdgeLabelRenderer, EdgeProps, Position, getSmoothStepPath } from '@xyflow/react'
import { ConnectionFlowEdge } from '../flowSync/flowTypes'
import { EDGE_IDLE_COLOR, EDGE_SELECTED_COLOR } from '../constants'

const ARROW_LENGTH = 10
const ARROW_HALF_WIDTH = 5

// The path always meets the target handle head-on along that handle's axis, so the
// arrow's direction is fully determined by which side of the node it's attached to.
const ARROW_ANGLE_BY_TARGET_POSITION: Record<Position, number> = {
    [Position.Left]: 0,
    [Position.Bottom]: -90,
    [Position.Right]: 180,
    [Position.Top]: 90,
}

const ConnectionEdge: React.FC<EdgeProps<ConnectionFlowEdge>> = ({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
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
    const color = selected ? EDGE_SELECTED_COLOR : EDGE_IDLE_COLOR
    const arrowAngle = ARROW_ANGLE_BY_TARGET_POSITION[targetPosition]

    return (
        <>
            <BaseEdge path={path} style={{ stroke: color, strokeWidth: selected ? 3 : 2 }} />
            {/* Drawn manually (rather than via React Flow's SVG marker system) so it can
                react to `selected` the same way the line itself does — markers resolved
                through `defaultEdgeOptions` are static and ignore per-edge selection. */}
            <polygon
                points={`0,0 -${ARROW_LENGTH},-${ARROW_HALF_WIDTH} -${ARROW_LENGTH},${ARROW_HALF_WIDTH}`}
                fill={color}
                transform={`translate(${targetX} ${targetY}) rotate(${arrowAngle})`}
            />
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
