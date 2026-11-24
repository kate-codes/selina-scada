import React from 'react'
import { Autocomplete, TextField } from '@mui/material'

interface ResourceNameAutocompleteProps {
    label: string
    value: string
    onChange: (value: string) => void
    suggestions: string[]
}

const ResourceNameAutocomplete: React.FC<ResourceNameAutocompleteProps> = ({
    label,
    value,
    onChange,
    suggestions,
}) => {
    return (
        <Autocomplete
            freeSolo
            size="small"
            options={suggestions}
            inputValue={value}
            onInputChange={(_, newValue) => onChange(newValue)}
            renderInput={(params) => <TextField {...params} label={label} />}
        />
    )
}

export default ResourceNameAutocomplete
