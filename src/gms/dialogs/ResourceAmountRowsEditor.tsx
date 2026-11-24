import React from 'react'
import { Box, IconButton, Stack, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ResourceNameAutocomplete from '../components/ResourceNameAutocomplete'
import { ResourceAmount } from '../schema/types'

interface ResourceAmountRowsEditorProps {
    label: string
    rows: ResourceAmount[]
    onChange: (rows: ResourceAmount[]) => void
    resourceSuggestions: string[]
}

const ResourceAmountRowsEditor: React.FC<ResourceAmountRowsEditorProps> = ({
    label,
    rows,
    onChange,
    resourceSuggestions,
}) => {
    function updateRow(index: number, patch: Partial<ResourceAmount>) {
        onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
    }
    function removeRow(index: number) {
        onChange(rows.filter((_, i) => i !== index))
    }
    function addRow() {
        onChange([...rows, { resource: '', amount: 1 }])
    }

    return (
        <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                {label}
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
                            label="Amount"
                            type="number"
                            size="small"
                            value={row.amount}
                            onChange={(event) => updateRow(index, { amount: Number(event.target.value) || 0 })}
                            sx={{ width: 100 }}
                        />
                        <IconButton aria-label={`Remove ${label} row`} size="small" onClick={() => removeRow(index)}>
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                ))}
                <IconButton aria-label={`Add ${label} row`} size="small" onClick={addRow} sx={{ alignSelf: 'flex-start' }}>
                    <AddIcon fontSize="small" />
                </IconButton>
            </Stack>
        </Box>
    )
}

export default ResourceAmountRowsEditor
