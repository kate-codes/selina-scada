import React from 'react'
import { ConnectionLineComponentProps, getSmoothStepPath } from '@xyflow/react'
import { PORT_ACTIVE_COLOR } from '../constants'
import { UnitFlowNode } from '../flowSync/flowTypes'

const INVALID_COLOR = '#f44336'

const CustomConnectionLine: React.FC<ConnectionLineComponentProps<UnitFlowNode>> = ({
    fromX,
    fromY,
    toX,
    toY,
    fromPosition,
    toPosition,
    connectionStatus,
}) => {
    const [path] = getSmoothStepPath({
        sourceX: fromX,
        sourceY: fromY,
        sourcePosition: fromPosition,
        targetX: toX,
        targetY: toY,
        targetPosition: toPosition,
        borderRadius: 12,
    })

    const stroke = connectionStatus === 'invalid' ? INVALID_COLOR : PORT_ACTIVE_COLOR

    return (
        <g>
            <path d={path} fill="none" stroke={stroke} strokeWidth={2.5} strokeDasharray="6 4" />
            <circle cx={toX} cy={toY} r={5} fill={stroke} stroke="white" strokeWidth={1.5} />
        </g>
    )
}

export default CustomConnectionLine
