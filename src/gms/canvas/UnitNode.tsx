import React from 'react'
import { NodeProps } from '@xyflow/react'
import { Box, Card, Chip, IconButton, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import RemoveIcon from '@mui/icons-material/Remove'
import { ANCHOR_POSITIONS, UNIT_TYPE_LABELS } from '../constants'
import { IO_PROCESS_FIELD_CONFIG } from '../fieldConfig/ioProcessFieldConfig'
import { STORAGE_FIELD_CONFIG } from '../fieldConfig/storageFieldConfig'
import { UnitFlowNode } from '../flowSync/flowTypes'
import { Unit } from '../schema/types'
import { isIoProcessRuntimeState } from '../simulation/simulationTypes'
import PortHandle from './PortHandle'

export interface UnitNodeProps extends NodeProps<UnitFlowNode> {
    onEdit: (unit: Unit) => void
    onDelete: (unit: Unit) => void
    onWorkerCountChange: (unitId: string, count: number) => void
    onHaulerCountChange: (unitId: string, count: number) => void
}

function formatResourceList(rows: { resource: string; amount: number }[]): string {
    return rows.map((row) => `${row.amount} ${row.resource || '?'}`).join(', ')
}

function formatBufferEntries(buffers: Record<string, number>): string {
    const entries = Object.entries(buffers).filter(([, amount]) => amount > 0)
    if (entries.length === 0) return 'empty'
    return entries.map(([resource, amount]) => `${Math.round(amount * 10) / 10} ${resource}`).join(', ')
}

function renderSummary(unit: Unit): React.ReactNode {
    if (unit.type === 'ioProcess') {
        const { cycleTimeSeconds, workerCount, powerConsumptionKw, inputs, outputs } = unit.properties
        // Each stat is only worth showing once it's been raised above its slider's floor —
        // at the minimum it's just noise repeated across every freshly created unit.
        const stats: string[] = []
        if (cycleTimeSeconds > IO_PROCESS_FIELD_CONFIG.cycleTimeSeconds.min) stats.push(`Cycle ${cycleTimeSeconds}s`)
        if (workerCount > IO_PROCESS_FIELD_CONFIG.workerCount.min) stats.push(`${workerCount} workers`)
        if (powerConsumptionKw > IO_PROCESS_FIELD_CONFIG.powerConsumptionKw.min) stats.push(`${powerConsumptionKw} kW`)

        return (
            <Stack spacing={0.25}>
                {stats.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                        {stats.join(' · ')}
                    </Typography>
                )}
                <Typography variant="caption" color="text.secondary" noWrap>
                    {formatResourceList(inputs) || 'no inputs'} {'→'} {formatResourceList(outputs) || 'no outputs'}
                </Typography>
            </Stack>
        )
    }

    const { capacity, haulerCount, overflowRule } = unit.properties
    const stats: string[] = []
    if (capacity.isInfinite) {
        stats.push('Cap ∞')
    } else if (capacity.maxUnits > STORAGE_FIELD_CONFIG.maxUnits.min) {
        stats.push(`Cap ${capacity.maxUnits}`)
    }
    if (haulerCount > STORAGE_FIELD_CONFIG.haulerCount.min) stats.push(`${haulerCount} haulers`)
    stats.push(overflowRule)

    return (
        <Typography variant="caption" color="text.secondary">
            {stats.join(' · ')}
        </Typography>
    )
}

function renderLiveStats(unit: Unit, runtime: UnitNodeProps['data']['runtime']): React.ReactNode {
    if (!runtime) return null

    if (unit.type === 'ioProcess' && isIoProcessRuntimeState(runtime)) {
        const { cycleTimeSeconds } = unit.properties
        const progressPercent =
            cycleTimeSeconds > 0 ? Math.round((runtime.cycleProgressSeconds / cycleTimeSeconds) * 100) : 0
        return (
            <Stack spacing={0.25}>
                <Typography variant="caption" color="text.secondary" noWrap>
                    In: {formatBufferEntries(runtime.inputBuffers)}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                    Out: {formatBufferEntries(runtime.outputBuffers)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Cycle {progressPercent}%
                </Typography>
            </Stack>
        )
    }

    if (unit.type === 'storage' && !isIoProcessRuntimeState(runtime)) {
        const { capacity } = unit.properties
        const total = Object.values(runtime.stock).reduce((sum, value) => sum + value, 0)
        return (
            <Stack spacing={0.25}>
                <Typography variant="caption" color="text.secondary" noWrap>
                    Stock: {formatBufferEntries(runtime.stock)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {capacity.isInfinite ? `${Math.round(total * 10) / 10} total` : `${Math.round(total * 10) / 10} / ${capacity.maxUnits}`}
                </Typography>
            </Stack>
        )
    }

    return null
}

interface LiveCountStepperProps {
    label: string
    count: number
    min: number
    max: number
    onChange: (count: number) => void
}

const LiveCountStepper: React.FC<LiveCountStepperProps> = ({ label, count, min, max, onChange }) => (
    <Stack direction="row" alignItems="center" spacing={0.25} className="nodrag">
        <IconButton
            aria-label={`Decrease ${label}`}
            size="small"
            disabled={count <= min}
            onClick={(event) => {
                event.stopPropagation()
                onChange(count - 1)
            }}
        >
            <RemoveIcon fontSize="inherit" />
        </IconButton>
        <Typography variant="caption" sx={{ minWidth: 14, textAlign: 'center' }}>
            {count}
        </Typography>
        <IconButton
            aria-label={`Increase ${label}`}
            size="small"
            disabled={count >= max}
            onClick={(event) => {
                event.stopPropagation()
                onChange(count + 1)
            }}
        >
            <AddIcon fontSize="inherit" />
        </IconButton>
    </Stack>
)

const UnitNode: React.FC<UnitNodeProps> = ({
    data,
    selected,
    onEdit,
    onDelete,
    onWorkerCountChange,
    onHaulerCountChange,
}) => {
    const { unit, isPlaying, runtime } = data

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
                // MUI Card defaults to overflow: hidden, which clips roughly half of each
                // port handle's hit area since they sit centered on the card's edge.
                overflow: 'visible',
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
                {isPlaying ? (
                    unit.type === 'ioProcess' ? (
                        <LiveCountStepper
                            label="worker count"
                            count={runtime && isIoProcessRuntimeState(runtime) ? runtime.liveWorkerCount : 0}
                            min={IO_PROCESS_FIELD_CONFIG.workerCount.min}
                            max={IO_PROCESS_FIELD_CONFIG.workerCount.max}
                            onChange={(count) => onWorkerCountChange(unit.id, count)}
                        />
                    ) : (
                        <LiveCountStepper
                            label="hauler count"
                            count={runtime && !isIoProcessRuntimeState(runtime) ? runtime.liveHaulerCount : 0}
                            min={STORAGE_FIELD_CONFIG.haulerCount.min}
                            max={STORAGE_FIELD_CONFIG.haulerCount.max}
                            onChange={(count) => onHaulerCountChange(unit.id, count)}
                        />
                    )
                ) : (
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
                )}
            </Stack>

            <Box sx={{ mt: 1 }}>{isPlaying ? renderLiveStats(unit, runtime) : renderSummary(unit)}</Box>
        </Card>
    )
}

export default UnitNode
