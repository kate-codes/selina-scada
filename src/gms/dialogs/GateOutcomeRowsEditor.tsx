import React from 'react'
import { Box, IconButton, Stack, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ResourceNameAutocomplete from '../components/ResourceNameAutocomplete'
import { GateOutcome } from '../schema/types'

interface GateOutcomeRowsEditorProps {
    rows: GateOutcome[]
    onChange: (rows: GateOutcome[]) => void
    resourceSuggestions: string[]
}

const GateOutcomeRowsEditor: React.FC<GateOutcomeRowsEditorProps> = ({ rows, onChange, resourceSuggestions }) => {
    function updateRow(index: number, patch: Partial<GateOutcome>) {
        onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
    }
    function removeRow(index: number) {
        onChange(rows.filter((_, i) => i !== index))
    }
    function addRow() {
        onChange([...rows, { resource: '', weight: 50 }])
    }

    return (
        <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                Possible Outcomes
            </Typography>
            <Stack spacing={1}>
                {rows.map((row, index) => (
                    <Stack key={index} direction="row" spacing={1} alignItems="center">
                        <Box sx={{ flex: 1 }}>
                            <ResourceNameAutocomplete
                                label="Resource"
                                value={row.resource}
                                onChange={(value) => updateRow(index, { resource: value })}
                                suggestions={resourceSuggestions}
                            />
                        </Box>
                        <TextField
                            label="Weight"
                            type="number"
                            size="small"
                            value={row.weight}
                            onChange={(event) => updateRow(index, { weight: Number(event.target.value) || 0 })}
                            sx={{ width: 100 }}
                        />
                        <IconButton aria-label="Remove outcome row" size="small" onClick={() => removeRow(index)}>
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                ))}
                <IconButton aria-label="Add outcome row" size="small" onClick={addRow} sx={{ alignSelf: 'flex-start' }}>
                    <AddIcon fontSize="small" />
                </IconButton>
            </Stack>
        </Box>
    )
}

export default GateOutcomeRowsEditor
