import React from 'react'
import { Box, Slider, TextField, Typography } from '@mui/material'

interface LabeledSliderFieldProps {
    label: string
    value: number
    onChange: (value: number) => void
    min: number
    max: number
    step: number
    unit?: string
}

const LabeledSliderField: React.FC<LabeledSliderFieldProps> = ({ label, value, onChange, min, max, step, unit }) => {
    return (
        <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                {label}
                {unit ? ` (${unit})` : ''}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Slider
                    value={value}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(_, newValue) => onChange(newValue as number)}
                    sx={{ flex: 1 }}
                />
                <TextField
                    type="number"
                    size="small"
                    value={value}
                    onChange={(event) => {
                        const parsed = Number(event.target.value)
                        if (!Number.isNaN(parsed)) onChange(parsed)
                    }}
                    inputProps={{ min, max, step }}
                    sx={{ width: 96 }}
                />
            </Box>
        </Box>
    )
}

export default LabeledSliderField
