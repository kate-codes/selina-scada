import React from 'react'
import { BaseEdge, EdgeLabelRenderer, EdgeProps, Position, getSmoothStepPath } from '@xyflow/react'
import { IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { ConnectionFlowEdge } from '../flowSync/flowTypes'
import { EDGE_IDLE_COLOR, EDGE_SELECTED_COLOR } from '../constants'

export interface ConnectionEdgeProps extends EdgeProps<ConnectionFlowEdge> {
    onDelete: (edgeId: string) => void
}

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

const ConnectionEdge: React.FC<ConnectionEdgeProps> = ({
    id,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    data,
    selected,
    onDelete,
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
            <EdgeLabelRenderer>
                <div
                    className="gms-edge-controls"
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                    }}
                >
                    {sourceResource && <span className="gms-edge-label">{sourceResource}</span>}
                    {/* Only shown once selected — otherwise it sits exactly where a first
                        click opens the resource-mapping popover, and a user aiming for
                        that would instead delete the link. */}
                    {selected && (
                        <IconButton
                            aria-label="Delete link"
                            size="small"
                            className="nodrag nopan gms-edge-delete-btn"
                            onClick={(event) => {
                                event.stopPropagation()
                                onDelete(id)
                            }}
                        >
                            <CloseIcon fontSize="inherit" />
                        </IconButton>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    )
}

export default ConnectionEdge
