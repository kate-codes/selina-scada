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

// How far the delete button sits above the line/label. Widened below the default (20)
// so the edge's own hover/click band comfortably covers the gap between the line and the
// offset button — otherwise the mouse would cross a dead zone that isn't hoverable,
// causing the button to vanish before the cursor reaches it.
const DELETE_BUTTON_OFFSET_Y = 20
const INTERACTION_WIDTH = 2 * DELETE_BUTTON_OFFSET_Y + 8

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
            <BaseEdge
                path={path}
                interactionWidth={INTERACTION_WIDTH}
                style={{ stroke: color, strokeWidth: selected ? 3 : 2 }}
            />
            {/* Drawn manually (rather than via React Flow's SVG marker system) so it can
                react to `selected` the same way the line itself does — markers resolved
                through `defaultEdgeOptions` are static and ignore per-edge selection. */}
            <polygon
                points={`0,0 -${ARROW_LENGTH},-${ARROW_HALF_WIDTH} -${ARROW_LENGTH},${ARROW_HALF_WIDTH}`}
                fill={color}
                transform={`translate(${targetX} ${targetY}) rotate(${arrowAngle})`}
            />
            <EdgeLabelRenderer>
                {sourceResource ? (
                    // Label + delete button share one row, centered on the line/midpoint —
                    // the button sits to the right of the text rather than floating above
                    // it, and only mounts on hover (see the no-label case below for why
                    // hover rather than `selected` drives this).
                    <div
                        className="gms-edge-controls"
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        }}
                    >
                        <span className="gms-edge-label">{sourceResource}</span>
                        {data?.isHovered && (
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
                ) : (
                    data?.isHovered && (
                        // No label to sit beside, so the button is offset above the line
                        // instead — not tied to `selected`, since selection also flips true
                        // just from opening the resource-mapping popover (a click always
                        // does both) and can outlive the popover closing, leaving this
                        // stranded on the canvas. Hovering away, or the popover being open
                        // for this edge, hides it (see GmsCanvas's `displayEdges`). Offset
                        // rather than centered on the line so it's never what a click aimed
                        // at the line itself actually lands on.
                        <div
                            className="gms-edge-controls"
                            style={{
                                position: 'absolute',
                                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - DELETE_BUTTON_OFFSET_Y}px)`,
                            }}
                        >
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
                        </div>
                    )
                )}
            </EdgeLabelRenderer>
        </>
    )
}

export default ConnectionEdge
