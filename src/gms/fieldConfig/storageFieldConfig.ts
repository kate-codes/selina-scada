import { NumericFieldConfig } from './types'

export const STORAGE_FIELD_CONFIG: Record<'maxUnits' | 'serviceRadiusMeters' | 'haulerCount', NumericFieldConfig> = {
    maxUnits: { label: 'Maximum Storage Capacity', min: 0, max: 10000, step: 10, unit: 'units' },
    serviceRadiusMeters: { label: 'Logistics Radius / Service Range', min: 0, max: 500, step: 5, unit: 'm' },
    haulerCount: { label: 'Hauler / Transport Unit Count', min: 0, max: 8, step: 1, unit: 'haulers' },
}
