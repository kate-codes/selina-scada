import React from 'react'
import { FormControlLabel, MenuItem, Select, Stack, Switch, Typography } from '@mui/material'
import LabeledSliderField from '../components/LabeledSliderField'
import { STORAGE_FIELD_CONFIG } from '../fieldConfig/storageFieldConfig'
import { OverflowRule, StorageUnitProperties } from '../schema/types'
import StockpileFilterRowsEditor from './StockpileFilterRowsEditor'

const OVERFLOW_RULE_LABELS: Record<OverflowRule, string> = {
    haltProduction: 'Halt Production',
    spillWaste: 'Spill / Waste',
    autoSellSurplus: 'Auto-Sell Surplus',
}

interface StorageUnitFormProps {
    properties: StorageUnitProperties
    onChange: (properties: StorageUnitProperties) => void
    resourceSuggestions: string[]
}

const StorageUnitForm: React.FC<StorageUnitFormProps> = ({ properties, onChange, resourceSuggestions }) => {
    const radius = STORAGE_FIELD_CONFIG.serviceRadiusMeters
    const haulers = STORAGE_FIELD_CONFIG.haulerCount
    const maxUnits = STORAGE_FIELD_CONFIG.maxUnits

    return (
        <Stack spacing={2.5}>
            <Stack spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Maximum Storage Capacity
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={properties.capacity.isInfinite}
                            onChange={(event) =>
                                onChange({
                                    ...properties,
                                    capacity: { ...properties.capacity, isInfinite: event.target.checked },
                                })
                            }
                        />
                    }
                    label="Infinite capacity"
                />
                {!properties.capacity.isInfinite && (
                    <LabeledSliderField
                        label={maxUnits.label}
                        unit={maxUnits.unit}
                        min={maxUnits.min}
                        max={maxUnits.max}
                        step={maxUnits.step}
                        value={properties.capacity.maxUnits}
                        onChange={(value) =>
                            onChange({ ...properties, capacity: { ...properties.capacity, maxUnits: value } })
                        }
                    />
                )}
            </Stack>

            <LabeledSliderField
                label={radius.label}
                unit={radius.unit}
                min={radius.min}
                max={radius.max}
                step={radius.step}
                value={properties.serviceRadiusMeters}
                onChange={(value) => onChange({ ...properties, serviceRadiusMeters: value })}
            />

            <LabeledSliderField
                label={haulers.label}
                unit={haulers.unit}
                min={haulers.min}
                max={haulers.max}
                step={haulers.step}
                value={properties.haulerCount}
                onChange={(value) => onChange({ ...properties, haulerCount: value })}
            />

            <Stack spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Overflow / Spillage Rule
                </Typography>
                <Select
                    size="small"
                    value={properties.overflowRule}
                    onChange={(event) => onChange({ ...properties, overflowRule: event.target.value as OverflowRule })}
                >
                    {(Object.keys(OVERFLOW_RULE_LABELS) as OverflowRule[]).map((rule) => (
                        <MenuItem key={rule} value={rule}>
                            {OVERFLOW_RULE_LABELS[rule]}
                        </MenuItem>
                    ))}
                </Select>
            </Stack>

            <StockpileFilterRowsEditor
                rows={properties.stockpileFilters}
                onChange={(rows) => onChange({ ...properties, stockpileFilters: rows })}
                resourceSuggestions={resourceSuggestions}
            />
        </Stack>
    )
}

export default StorageUnitForm
