import React from 'react'
import { BaseEdge, EdgeLabelRenderer, EdgeProps, Position, getSmoothStepPath } from '@xyflow/react'
import { IconButton, SvgIconProps } from '@mui/material'
import AutoModeIcon from '@mui/icons-material/AutoMode'
import CallSplitIcon from '@mui/icons-material/CallSplit'
import CasinoIcon from '@mui/icons-material/Casino'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import TouchAppIcon from '@mui/icons-material/TouchApp'
import { ConnectionFlowEdge } from '../flowSync/flowTypes'
import { EDGE_IDLE_COLOR, EDGE_SELECTED_COLOR } from '../constants'
import { GateConfig, GateKind } from '../schema/types'

export interface ConnectionEdgeProps extends EdgeProps<ConnectionFlowEdge> {
    onDelete: (edgeId: string) => void
    onGateToggle: (edgeId: string, nextGate: GateConfig) => void
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

const GATE_KIND_ICONS: Record<GateKind, React.ComponentType<SvgIconProps>> = {
    interactive: TouchAppIcon,
    random: CasinoIcon,
    deterministic: CallSplitIcon,
    automatic: AutoModeIcon,
}

function trimmedOrNull(value: string | undefined): string | null {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
}

// One segment per "variable of note" for the gate kind, skipping anything left unset
// so an edge with a half-filled-out gate doesn't render empty/awkward segments.
function gateLabelSegments(gate: GateConfig): string[] {
    switch (gate.kind) {
        case 'interactive':
            return [gate.isOpen ? 'Open' : 'Closed']
        case 'random':
            return gate.outcomes
                .filter((outcome) => outcome.resource.trim())
                .map((outcome) => `${outcome.resource.trim()} ${outcome.weight}%`)
        case 'automatic':
            return [
                ...gate.outcomes
                    .filter((outcome) => outcome.resource.trim())
                    .map((outcome) => `${outcome.resource.trim()} ${outcome.weight}%`),
                `every ${gate.intervalSeconds}s`,
            ]
        case 'deterministic': {
            const segments: string[] = []
            const conditionResource = trimmedOrNull(gate.conditionResource)
            if (conditionResource) segments.push(`${conditionResource} ${gate.operator} ${gate.threshold}`)
            const thenResource = trimmedOrNull(gate.thenResource)
            if (thenResource) segments.push(thenResource)
            const elseResource = trimmedOrNull(gate.elseResource)
            if (elseResource) segments.push(elseResource)
            return segments
        }
    }
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
    onGateToggle,
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

    const gate = data?.gate ?? null
    const color = selected ? EDGE_SELECTED_COLOR : EDGE_IDLE_COLOR
    const arrowAngle = ARROW_ANGLE_BY_TARGET_POSITION[targetPosition]

    // A plain linker shows its (static) source and target resource. A gate redistributes
    // whatever arrives rather than passing it to one fixed resource, so its label shows
    // the source resource plus every variable of note from the gate's own mechanics
    // instead of the now-inapplicable static target resource.
    const segments = gate
        ? [trimmedOrNull(data?.mapping?.sourceResource), ...gateLabelSegments(gate)].filter(
              (segment): segment is string => segment !== null,
          )
        : [trimmedOrNull(data?.mapping?.sourceResource)].filter((segment): segment is string => segment !== null)

    // Only meaningful once there's more than one segment to lay out — stack them to
    // match a vertical (top/bottom-handled) connection instead of running them inline.
    const isVerticalLabel = gate !== null && (targetPosition === Position.Top || targetPosition === Position.Bottom)

    const GateIcon = gate ? GATE_KIND_ICONS[gate.kind] : null

    // Only the interactive kind has a single player-flippable state — the other kinds
    // are driven by probability/condition/timer, so there's nothing to toggle on hover.
    const interactiveGate = gate?.kind === 'interactive' ? gate : null
    const ToggleIcon = interactiveGate?.isOpen ? ToggleOnIcon : ToggleOffIcon

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
                {segments.length > 0 || GateIcon ? (
                    // Label + delete button share one row, centered on the line/midpoint —
                    // the delete button sits to the right of the text and (for an interactive
                    // gate) a player-flippable open/closed toggle sits to the left, both just
                    // outside the text rather than floating above it, and both only mount on
                    // hover (see the no-label case below for why hover rather than `selected`
                    // drives this). The gate kind icon, when present, is appended to the end
                    // of the label text itself (last line when stacked vertically) rather
                    // than floating separately near the arrowhead.
                    <div
                        className="gms-edge-controls"
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        }}
                    >
                        {data?.isHovered && interactiveGate && (
                            <IconButton
                                aria-label={interactiveGate.isOpen ? 'Close gate' : 'Open gate'}
                                size="small"
                                className="nodrag nopan gms-edge-toggle-btn"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    onGateToggle(id, { ...interactiveGate, isOpen: !interactiveGate.isOpen })
                                }}
                            >
                                <ToggleIcon fontSize="inherit" />
                            </IconButton>
                        )}
                        {isVerticalLabel ? (
                            <span
                                className="gms-edge-label"
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                            >
                                {segments.map((segment, index) => (
                                    <span key={index}>
                                        {segment}
                                        {index < segments.length - 1 ? ' -' : ''}
                                    </span>
                                ))}
                                {GateIcon && (
                                    <span style={{ display: 'flex', color }}>
                                        <GateIcon sx={{ fontSize: 14 }} />
                                    </span>
                                )}
                            </span>
                        ) : (
                            <span
                                className="gms-edge-label"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                                {segments.length > 0 && <span>{segments.join(' - ')}</span>}
                                {GateIcon && (
                                    <span style={{ display: 'flex', color }}>
                                        <GateIcon sx={{ fontSize: 14 }} />
                                    </span>
                                )}
                            </span>
                        )}
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
                                <DeleteOutlineIcon fontSize="inherit" />
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
                                <DeleteOutlineIcon fontSize="inherit" />
                            </IconButton>
                        </div>
                    )
                )}
            </EdgeLabelRenderer>
        </>
    )
}

export default ConnectionEdge
