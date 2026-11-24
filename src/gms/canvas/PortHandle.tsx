import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { AnchorPosition } from '../schema/types'
import { PORT_IDLE_COLOR } from '../constants'

const RF_POSITION_BY_ANCHOR: Record<AnchorPosition, Position> = {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left,
}

// The hit area is deliberately larger than the visible dot, so grabbing a link is as
// forgiving as the anchor arrows in diagramming tools like draw.io rather than requiring
// a pixel-perfect click on a tiny circle.
const HIT_AREA_SIZE = 24
const DOT_SIZE = 10

const CSS_PLACEMENT_BY_ANCHOR: Record<AnchorPosition, React.CSSProperties> = {
    top: { top: -HIT_AREA_SIZE / 2, left: '50%', transform: 'translate(-50%, 0)' },
    right: { top: '50%', right: -HIT_AREA_SIZE / 2, left: 'auto', transform: 'translate(0, -50%)' },
    bottom: { bottom: -HIT_AREA_SIZE / 2, top: 'auto', left: '50%', transform: 'translate(-50%, 0)' },
    left: { top: '50%', left: -HIT_AREA_SIZE / 2, transform: 'translate(0, -50%)' },
}

interface PortHandleProps {
    anchor: AnchorPosition
}

const PortHandle: React.FC<PortHandleProps> = ({ anchor }) => {
    return (
        <Handle
            id={anchor}
            type="source"
            position={RF_POSITION_BY_ANCHOR[anchor]}
            className="gms-port-handle"
            style={{
                width: HIT_AREA_SIZE,
                height: HIT_AREA_SIZE,
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                cursor: 'crosshair',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...CSS_PLACEMENT_BY_ANCHOR[anchor],
            }}
        >
            <span
                className="gms-port-handle-dot"
                style={{
                    width: DOT_SIZE,
                    height: DOT_SIZE,
                    borderRadius: '50%',
                    background: PORT_IDLE_COLOR,
                    border: '2px solid white',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
                }}
            />
        </Handle>
    )
}

export default PortHandle
