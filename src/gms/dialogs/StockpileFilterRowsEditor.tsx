import React from 'react'
import { Box, IconButton, MenuItem, Select, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ResourceNameAutocomplete from '../components/ResourceNameAutocomplete'
import { StockpileFilter, StockpilePriority } from '../schema/types'

const PRIORITIES: StockpilePriority[] = ['high', 'normal', 'low', 'reject']

interface StockpileFilterRowsEditorProps {
    rows: StockpileFilter[]
    onChange: (rows: StockpileFilter[]) => void
    resourceSuggestions: string[]
}

const StockpileFilterRowsEditor: React.FC<StockpileFilterRowsEditorProps> = ({
    rows,
    onChange,
    resourceSuggestions,
}) => {
    function updateRow(index: number, patch: Partial<StockpileFilter>) {
        onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
    }
    function removeRow(index: number) {
        onChange(rows.filter((_, i) => i !== index))
    }
    function addRow() {
        onChange([...rows, { resource: '', priority: 'normal' }])
    }

    return (
        <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                Stockpile Filters & Priority Rules
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
                        <Select
                            size="small"
                            value={row.priority}
                            onChange={(event) => updateRow(index, { priority: event.target.value as StockpilePriority })}
                            sx={{ width: 140 }}
                        >
                            {PRIORITIES.map((priority) => (
                                <MenuItem key={priority} value={priority}>
                                    {priority}
                                </MenuItem>
                            ))}
                        </Select>
                        <IconButton aria-label="Remove filter row" size="small" onClick={() => removeRow(index)}>
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                ))}
                <IconButton aria-label="Add filter row" size="small" onClick={addRow} sx={{ alignSelf: 'flex-start' }}>
                    <AddIcon fontSize="small" />
                </IconButton>
            </Stack>
        </Box>
    )
}

export default StockpileFilterRowsEditor
