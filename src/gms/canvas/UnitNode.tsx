import React from 'react'
import { NodeProps } from '@xyflow/react'
import { Box, Card, Chip, IconButton, Stack, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import { ANCHOR_POSITIONS, UNIT_TYPE_LABELS } from '../constants'
import { UnitFlowNode } from '../flowSync/flowTypes'
import { Unit } from '../schema/types'
import PortHandle from './PortHandle'

export interface UnitNodeProps extends NodeProps<UnitFlowNode> {
    onEdit: (unit: Unit) => void
    onDelete: (unit: Unit) => void
}

function formatResourceList(rows: { resource: string; amount: number }[]): string {
    return rows.map((row) => `${row.amount} ${row.resource || '?'}`).join(', ')
}

function renderSummary(unit: Unit): React.ReactNode {
    if (unit.type === 'ioProcess') {
        const { cycleTimeSeconds, workerCount, powerConsumptionKw, inputs, outputs } = unit.properties
        return (
            <Stack spacing={0.25}>
                <Typography variant="caption" color="text.secondary">
                    Cycle {cycleTimeSeconds}s · {workerCount} workers · {powerConsumptionKw} kW
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                    {formatResourceList(inputs) || 'no inputs'} {'→'} {formatResourceList(outputs) || 'no outputs'}
                </Typography>
            </Stack>
        )
    }

    const { capacity, haulerCount, overflowRule } = unit.properties
    return (
        <Typography variant="caption" color="text.secondary">
            Cap {capacity.isInfinite ? '∞' : capacity.maxUnits} · {haulerCount} haulers · {overflowRule}
        </Typography>
    )
}

const UnitNode: React.FC<UnitNodeProps> = ({ data, selected, onEdit, onDelete }) => {
    const { unit } = data

    return (
        <Card
            variant="outlined"
            sx={{
                position: 'relative',
                width: 220,
                borderRadius: 3,
                p: 1.5,
                borderColor: selected ? 'secondary.main' : 'divider',
                boxShadow: selected ? 4 : 1,
            }}
        >
            {ANCHOR_POSITIONS.map((anchor) => (
                <PortHandle key={anchor} anchor={anchor} />
            ))}

            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap title={unit.name}>
                        {unit.name || 'Untitled unit'}
                    </Typography>
                    <Chip
                        label={UNIT_TYPE_LABELS[unit.type]}
                        size="small"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.65rem', mt: 0.25 }}
                    />
                </Box>
                <Stack direction="row" spacing={0.5}>
                    <IconButton
                        aria-label="Edit unit"
                        size="small"
                        className="nodrag"
                        onClick={(event) => {
                            event.stopPropagation()
                            onEdit(unit)
                        }}
                    >
                        <EditIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                        aria-label="Delete unit"
                        size="small"
                        className="nodrag"
                        onClick={(event) => {
                            event.stopPropagation()
                            onDelete(unit)
                        }}
                    >
                        <CloseIcon fontSize="inherit" />
                    </IconButton>
                </Stack>
            </Stack>

            <Box sx={{ mt: 1 }}>{renderSummary(unit)}</Box>
        </Card>
    )
}

export default UnitNode
