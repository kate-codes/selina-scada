import React from 'react'
import {
    Box,
    IconButton,
    MenuItem,
    Popover,
    Select,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import GateOutcomeRowsEditor from '../dialogs/GateOutcomeRowsEditor'
import ResourceNameAutocomplete from '../components/ResourceNameAutocomplete'
import { useResourceNameSuggestions } from '../hooks/useResourceNameSuggestions'
import { createDefaultGateConfig } from '../schema/defaults'
import { GateConditionOperator, GateConfig, GateKind, GateOutcome } from '../schema/types'
import { useGmsStore } from '../state/GmsContext'

const GATE_KINDS: GateKind[] = ['interactive', 'random', 'deterministic', 'automatic']
const GATE_KIND_LABELS: Record<GateKind, string> = {
    interactive: 'Interactive (manual toggle)',
    random: 'Random (probabilistic output)',
    deterministic: 'Deterministic (conditional output)',
    automatic: 'Automatic (random output on a timer)',
}
const GATE_CONDITION_OPERATORS: GateConditionOperator[] = ['>', '>=', '<', '<=', '==']

interface EdgeResourceMappingPopoverProps {
    edgeId: string
    anchorPosition: { top: number; left: number }
    onClose: () => void
}

const EdgeResourceMappingPopover: React.FC<EdgeResourceMappingPopoverProps> = ({
    edgeId,
    anchorPosition,
    onClose,
}) => {
    const { gms, dispatch } = useGmsStore()
    const resourceSuggestions = useResourceNameSuggestions()
    const connection = gms.connections.find((c) => c.id === edgeId)

    if (!connection) return null

    const mapping = connection.resourceMapping ?? { sourceResource: '', targetResource: '' }
    const gate = connection.gate

    function updateMapping(patch: Partial<typeof mapping>) {
        dispatch({
            type: 'connection/setMapping',
            id: edgeId,
            mapping: { ...mapping, ...patch },
        })
    }

    function setGate(nextGate: GateConfig | null) {
        dispatch({ type: 'connection/setGate', id: edgeId, gate: nextGate })
    }

    function updateGate(patch: Partial<GateConfig>) {
        if (!gate) return
        setGate({ ...gate, ...patch } as GateConfig)
    }

    function handleDelete() {
        dispatch({ type: 'connection/remove', ids: [edgeId] })
        onClose()
    }

    function renderGateFields() {
        if (!gate) return null

        switch (gate.kind) {
            case 'interactive':
                return (
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2">Open by default</Typography>
                        <Switch
                            checked={gate.isOpen}
                            onChange={(event) => updateGate({ isOpen: event.target.checked })}
                        />
                    </Stack>
                )
            case 'random':
                return (
                    <GateOutcomeRowsEditor
                        rows={gate.outcomes}
                        onChange={(outcomes: GateOutcome[]) => updateGate({ outcomes })}
                        resourceSuggestions={resourceSuggestions}
                    />
                )
            case 'automatic':
                return (
                    <Stack spacing={1.5}>
                        <TextField
                            label="Interval (seconds)"
                            type="number"
                            size="small"
                            value={gate.intervalSeconds}
                            onChange={(event) => updateGate({ intervalSeconds: Number(event.target.value) || 0 })}
                        />
                        <GateOutcomeRowsEditor
                            rows={gate.outcomes}
                            onChange={(outcomes: GateOutcome[]) => updateGate({ outcomes })}
                            resourceSuggestions={resourceSuggestions}
                        />
                    </Stack>
                )
            case 'deterministic':
                return (
                    <Stack spacing={1.5}>
                        <ResourceNameAutocomplete
                            label="Condition resource"
                            value={gate.conditionResource}
                            onChange={(value) => updateGate({ conditionResource: value })}
                            suggestions={resourceSuggestions}
                        />
                        <Stack direction="row" spacing={1}>
                            <Select
                                size="small"
                                value={gate.operator}
                                onChange={(event) =>
                                    updateGate({ operator: event.target.value as GateConditionOperator })
                                }
                                sx={{ width: 90 }}
                            >
                                {GATE_CONDITION_OPERATORS.map((operator) => (
                                    <MenuItem key={operator} value={operator}>
                                        {operator}
                                    </MenuItem>
                                ))}
                            </Select>
                            <TextField
                                label="Threshold"
                                type="number"
                                size="small"
                                value={gate.threshold}
                                onChange={(event) => updateGate({ threshold: Number(event.target.value) || 0 })}
                                sx={{ flex: 1 }}
                            />
                        </Stack>
                        <ResourceNameAutocomplete
                            label="Then resource"
                            value={gate.thenResource}
                            onChange={(value) => updateGate({ thenResource: value })}
                            suggestions={resourceSuggestions}
                        />
                        <ResourceNameAutocomplete
                            label="Else resource"
                            value={gate.elseResource}
                            onChange={(value) => updateGate({ elseResource: value })}
                            suggestions={resourceSuggestions}
                        />
                    </Stack>
                )
        }
    }

    return (
        <Popover
            open
            onClose={onClose}
            anchorReference="anchorPosition"
            anchorPosition={anchorPosition}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
            <Box sx={{ p: 2, width: 340 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2">Resource Link</Typography>
                    <Tooltip title="Delete link">
                        <IconButton
                            aria-label="Delete link"
                            size="small"
                            onClick={handleDelete}
                            sx={{
                                color: 'text.secondary',
                                '&:hover': { backgroundColor: '#ffebee', color: '#c62828' },
                            }}
                        >
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
                <Stack spacing={1.5}>
                    <ResourceNameAutocomplete
                        label="Source resource"
                        value={mapping.sourceResource}
                        onChange={(value) => updateMapping({ sourceResource: value })}
                        suggestions={resourceSuggestions}
                    />
                    {gate ? (
                        // A gate redistributes whatever arrives rather than passing it to one
                        // fixed resource, so there's no static target to edit here anymore —
                        // the gate's own fields below are what actually determine the output(s).
                        <Typography variant="caption" color="text.secondary">
                            Target resource is determined by the gate's mechanics below, not set here.
                        </Typography>
                    ) : (
                        <ResourceNameAutocomplete
                            label="Target resource"
                            value={mapping.targetResource}
                            onChange={(value) => updateMapping({ targetResource: value })}
                            suggestions={resourceSuggestions}
                        />
                    )}
                </Stack>

                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}
                >
                    <Typography variant="subtitle2">Gate</Typography>
                    <Switch
                        checked={gate !== null}
                        onChange={(event) => {
                            if (event.target.checked) {
                                setGate(createDefaultGateConfig('interactive'))
                                // Clears the now-inapplicable static target so stale data can't
                                // linger (and reappear) if the gate is later turned back off.
                                updateMapping({ targetResource: '' })
                            } else {
                                setGate(null)
                            }
                        }}
                    />
                </Stack>
                {gate && (
                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                        <Select
                            size="small"
                            value={gate.kind}
                            onChange={(event) => setGate(createDefaultGateConfig(event.target.value as GateKind))}
                        >
                            {GATE_KINDS.map((kind) => (
                                <MenuItem key={kind} value={kind}>
                                    {GATE_KIND_LABELS[kind]}
                                </MenuItem>
                            ))}
                        </Select>
                        {renderGateFields()}
                    </Stack>
                )}
            </Box>
        </Popover>
    )
}

export default EdgeResourceMappingPopover
