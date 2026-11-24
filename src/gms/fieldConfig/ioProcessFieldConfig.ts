import { NumericFieldConfig } from './types'

export const IO_PROCESS_FIELD_CONFIG: Record<
    'cycleTimeSeconds' | 'workerCount' | 'powerConsumptionKw' | 'operatingCostPerMinute',
    NumericFieldConfig
> = {
    cycleTimeSeconds: { label: 'Cycle Time / Processing Speed', min: 0, max: 60, step: 0.1, unit: 's / batch' },
    workerCount: { label: 'Worker / Operator Allocation', min: 0, max: 4, step: 1, unit: 'workers' },
    powerConsumptionKw: { label: 'Utility / Power Consumption', min: 0, max: 500, step: 1, unit: 'kW' },
    operatingCostPerMinute: {
        label: 'Maintenance / Operating Cost',
        min: 0,
        max: 1000,
        step: 0.01,
        unit: '$ / min',
    },
}
