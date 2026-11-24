import React from 'react'
import { Stack } from '@mui/material'
import LabeledSliderField from '../components/LabeledSliderField'
import { IO_PROCESS_FIELD_CONFIG } from '../fieldConfig/ioProcessFieldConfig'
import { IOProcessUnitProperties } from '../schema/types'
import ResourceAmountRowsEditor from './ResourceAmountRowsEditor'

interface IOProcessUnitFormProps {
    properties: IOProcessUnitProperties
    onChange: (properties: IOProcessUnitProperties) => void
    resourceSuggestions: string[]
}

const IOProcessUnitForm: React.FC<IOProcessUnitFormProps> = ({ properties, onChange, resourceSuggestions }) => {
    const cycleTime = IO_PROCESS_FIELD_CONFIG.cycleTimeSeconds
    const workers = IO_PROCESS_FIELD_CONFIG.workerCount
    const power = IO_PROCESS_FIELD_CONFIG.powerConsumptionKw
    const cost = IO_PROCESS_FIELD_CONFIG.operatingCostPerMinute

    return (
        <Stack spacing={2.5}>
            <LabeledSliderField
                label={cycleTime.label}
                unit={cycleTime.unit}
                min={cycleTime.min}
                max={cycleTime.max}
                step={cycleTime.step}
                value={properties.cycleTimeSeconds}
                onChange={(value) => onChange({ ...properties, cycleTimeSeconds: value })}
            />

            <ResourceAmountRowsEditor
                label="Conversion Recipe — Inputs"
                rows={properties.inputs}
                onChange={(rows) => onChange({ ...properties, inputs: rows })}
                resourceSuggestions={resourceSuggestions}
            />
            <ResourceAmountRowsEditor
                label="Conversion Recipe — Outputs"
                rows={properties.outputs}
                onChange={(rows) => onChange({ ...properties, outputs: rows })}
                resourceSuggestions={resourceSuggestions}
            />

            <LabeledSliderField
                label={workers.label}
                unit={workers.unit}
                min={workers.min}
                max={workers.max}
                step={workers.step}
                value={properties.workerCount}
                onChange={(value) => onChange({ ...properties, workerCount: value })}
            />

            <LabeledSliderField
                label={power.label}
                unit={power.unit}
                min={power.min}
                max={power.max}
                step={power.step}
                value={properties.powerConsumptionKw}
                onChange={(value) => onChange({ ...properties, powerConsumptionKw: value })}
            />

            <LabeledSliderField
                label={cost.label}
                unit={cost.unit}
                min={cost.min}
                max={cost.max}
                step={cost.step}
                value={properties.operatingCostPerMinute}
                onChange={(value) => onChange({ ...properties, operatingCostPerMinute: value })}
            />
        </Stack>
    )
}

export default IOProcessUnitForm
