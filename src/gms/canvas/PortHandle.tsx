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

const CSS_PLACEMENT_BY_ANCHOR: Record<AnchorPosition, React.CSSProperties> = {
    top: { top: -6, left: '50%', transform: 'translate(-50%, 0)' },
    right: { top: '50%', right: -6, left: 'auto', transform: 'translate(0, -50%)' },
    bottom: { bottom: -6, top: 'auto', left: '50%', transform: 'translate(-50%, 0)' },
    left: { top: '50%', left: -6, transform: 'translate(0, -50%)' },
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
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: PORT_IDLE_COLOR,
                border: '2px solid white',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
                cursor: 'crosshair',
                ...CSS_PLACEMENT_BY_ANCHOR[anchor],
            }}
        />
    )
}

export default PortHandle
