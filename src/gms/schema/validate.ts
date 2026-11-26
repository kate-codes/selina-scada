import { ANCHOR_POSITIONS } from '../constants'
import {
    Connection,
    GameMechanicSchema,
    GateConditionOperator,
    GateConfig,
    GateKind,
    GateOutcome,
    IOProcessUnit,
    OverflowRule,
    ResourceAmount,
    StockpileFilter,
    StockpilePriority,
    StorageUnit,
    Unit,
} from './types'

export type SchemaValidationResult =
    | { ok: true; schema: GameMechanicSchema }
    | { ok: false; errors: string[] }

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value)
}

function isPosition2D(value: unknown, path: string, errors: string[]): boolean {
    if (!isPlainObject(value) || !isFiniteNumber(value.x) || !isFiniteNumber(value.y)) {
        errors.push(`${path} must be an object with numeric x and y`)
        return false
    }
    return true
}

function isResourceAmount(value: unknown, path: string, errors: string[]): value is ResourceAmount {
    if (!isPlainObject(value)) {
        errors.push(`${path} must be an object`)
        return false
    }
    let valid = true
    if (typeof value.resource !== 'string' || value.resource.trim() === '') {
        errors.push(`${path}.resource must be a non-empty string`)
        valid = false
    }
    if (!isFiniteNumber(value.amount) || value.amount < 0) {
        errors.push(`${path}.amount must be a non-negative number`)
        valid = false
    }
    return valid
}

function isResourceAmountArray(value: unknown, path: string, errors: string[]): value is ResourceAmount[] {
    if (!Array.isArray(value)) {
        errors.push(`${path} must be an array`)
        return false
    }
    return value
        .map((item, index) => isResourceAmount(item, `${path}[${index}]`, errors))
        .every(Boolean)
}

const STOCKPILE_PRIORITIES: StockpilePriority[] = ['high', 'normal', 'low', 'reject']
const OVERFLOW_RULES: OverflowRule[] = ['haltProduction', 'spillWaste', 'autoSellSurplus']

function isStockpileFilter(value: unknown, path: string, errors: string[]): value is StockpileFilter {
    if (!isPlainObject(value)) {
        errors.push(`${path} must be an object`)
        return false
    }
    let valid = true
    if (typeof value.resource !== 'string' || value.resource.trim() === '') {
        errors.push(`${path}.resource must be a non-empty string`)
        valid = false
    }
    if (!STOCKPILE_PRIORITIES.includes(value.priority as StockpilePriority)) {
        errors.push(`${path}.priority must be one of ${STOCKPILE_PRIORITIES.join(', ')}`)
        valid = false
    }
    return valid
}

function isIOProcessUnit(value: unknown, path: string, errors: string[]): value is IOProcessUnit {
    if (!isPlainObject(value)) {
        errors.push(`${path} must be an object`)
        return false
    }
    const props = value.properties
    if (!isPlainObject(props)) {
        errors.push(`${path}.properties must be an object`)
        return false
    }
    let valid = true
    if (!isFiniteNumber(props.cycleTimeSeconds) || props.cycleTimeSeconds < 0) {
        errors.push(`${path}.properties.cycleTimeSeconds must be a non-negative number`)
        valid = false
    }
    if (!isResourceAmountArray(props.inputs, `${path}.properties.inputs`, errors)) valid = false
    if (!isResourceAmountArray(props.outputs, `${path}.properties.outputs`, errors)) valid = false
    if (!isFiniteNumber(props.workerCount) || props.workerCount < 0 || props.workerCount > 4) {
        errors.push(`${path}.properties.workerCount must be a number between 0 and 4`)
        valid = false
    }
    if (!isFiniteNumber(props.powerConsumptionKw) || props.powerConsumptionKw < 0) {
        errors.push(`${path}.properties.powerConsumptionKw must be a non-negative number`)
        valid = false
    }
    if (!isFiniteNumber(props.operatingCostPerMinute) || props.operatingCostPerMinute < 0) {
        errors.push(`${path}.properties.operatingCostPerMinute must be a non-negative number`)
        valid = false
    }
    return valid
}

function isStorageUnit(value: unknown, path: string, errors: string[]): value is StorageUnit {
    if (!isPlainObject(value)) {
        errors.push(`${path} must be an object`)
        return false
    }
    const props = value.properties
    if (!isPlainObject(props)) {
        errors.push(`${path}.properties must be an object`)
        return false
    }
    let valid = true
    const capacity = props.capacity
    if (!isPlainObject(capacity) || typeof capacity.isInfinite !== 'boolean' || !isFiniteNumber(capacity.maxUnits) || capacity.maxUnits < 0) {
        errors.push(`${path}.properties.capacity must be { isInfinite: boolean, maxUnits: non-negative number }`)
        valid = false
    }
    if (!isFiniteNumber(props.serviceRadiusMeters) || props.serviceRadiusMeters < 0) {
        errors.push(`${path}.properties.serviceRadiusMeters must be a non-negative number`)
        valid = false
    }
    if (!isFiniteNumber(props.haulerCount) || props.haulerCount < 0 || props.haulerCount > 8) {
        errors.push(`${path}.properties.haulerCount must be a number between 0 and 8`)
        valid = false
    }
    if (!OVERFLOW_RULES.includes(props.overflowRule as OverflowRule)) {
        errors.push(`${path}.properties.overflowRule must be one of ${OVERFLOW_RULES.join(', ')}`)
        valid = false
    }
    if (!Array.isArray(props.stockpileFilters)) {
        errors.push(`${path}.properties.stockpileFilters must be an array`)
        valid = false
    } else if (
        !props.stockpileFilters
            .map((item, index) => isStockpileFilter(item, `${path}.properties.stockpileFilters[${index}]`, errors))
            .every(Boolean)
    ) {
        valid = false
    }
    return valid
}

function isUnit(value: unknown, path: string, errors: string[]): value is Unit {
    if (!isPlainObject(value)) {
        errors.push(`${path} must be an object`)
        return false
    }
    let valid = true
    if (typeof value.id !== 'string' || value.id.trim() === '') {
        errors.push(`${path}.id must be a non-empty string`)
        valid = false
    }
    if (typeof value.name !== 'string' || value.name.trim() === '') {
        errors.push(`${path}.name must be a non-empty string`)
        valid = false
    }
    if (!isPosition2D(value.position, `${path}.position`, errors)) valid = false

    if (value.type === 'ioProcess') {
        if (!isIOProcessUnit(value, path, errors)) valid = false
    } else if (value.type === 'storage') {
        if (!isStorageUnit(value, path, errors)) valid = false
    } else {
        errors.push(`${path}.type must be "ioProcess" or "storage"`)
        valid = false
    }
    return valid
}

const GATE_KINDS: GateKind[] = ['interactive', 'random', 'deterministic', 'automatic']
const GATE_CONDITION_OPERATORS: GateConditionOperator[] = ['>', '>=', '<', '<=', '==']

function isGateOutcome(value: unknown, path: string, errors: string[]): value is GateOutcome {
    if (!isPlainObject(value)) {
        errors.push(`${path} must be an object`)
        return false
    }
    let valid = true
    if (typeof value.resource !== 'string') {
        errors.push(`${path}.resource must be a string`)
        valid = false
    }
    if (!isFiniteNumber(value.weight) || value.weight < 0) {
        errors.push(`${path}.weight must be a non-negative number`)
        valid = false
    }
    return valid
}

function isGateOutcomeArray(value: unknown, path: string, errors: string[]): value is GateOutcome[] {
    if (!Array.isArray(value)) {
        errors.push(`${path} must be an array`)
        return false
    }
    return value.map((item, index) => isGateOutcome(item, `${path}[${index}]`, errors)).every(Boolean)
}

function isGateConfig(value: unknown, path: string, errors: string[]): value is GateConfig {
    if (!isPlainObject(value)) {
        errors.push(`${path} must be an object`)
        return false
    }
    if (!GATE_KINDS.includes(value.kind as GateKind)) {
        errors.push(`${path}.kind must be one of ${GATE_KINDS.join(', ')}`)
        return false
    }
    let valid = true
    switch (value.kind as GateKind) {
        case 'interactive':
            if (typeof value.isOpen !== 'boolean') {
                errors.push(`${path}.isOpen must be a boolean`)
                valid = false
            }
            break
        case 'random':
            if (!isGateOutcomeArray(value.outcomes, `${path}.outcomes`, errors)) valid = false
            break
        case 'deterministic':
            if (typeof value.conditionResource !== 'string') {
                errors.push(`${path}.conditionResource must be a string`)
                valid = false
            }
            if (!GATE_CONDITION_OPERATORS.includes(value.operator as GateConditionOperator)) {
                errors.push(`${path}.operator must be one of ${GATE_CONDITION_OPERATORS.join(', ')}`)
                valid = false
            }
            if (!isFiniteNumber(value.threshold)) {
                errors.push(`${path}.threshold must be a number`)
                valid = false
            }
            if (typeof value.thenResource !== 'string') {
                errors.push(`${path}.thenResource must be a string`)
                valid = false
            }
            if (typeof value.elseResource !== 'string') {
                errors.push(`${path}.elseResource must be a string`)
                valid = false
            }
            break
        case 'automatic':
            if (!isFiniteNumber(value.intervalSeconds) || value.intervalSeconds < 0) {
                errors.push(`${path}.intervalSeconds must be a non-negative number`)
                valid = false
            }
            if (!isGateOutcomeArray(value.outcomes, `${path}.outcomes`, errors)) valid = false
            break
    }
    return valid
}

function isConnection(value: unknown, path: string, errors: string[]): value is Connection {
    if (!isPlainObject(value)) {
        errors.push(`${path} must be an object`)
        return false
    }
    let valid = true
    if (typeof value.id !== 'string' || value.id.trim() === '') {
        errors.push(`${path}.id must be a non-empty string`)
        valid = false
    }
    if (typeof value.sourceShapeId !== 'string' || value.sourceShapeId.trim() === '') {
        errors.push(`${path}.sourceShapeId must be a non-empty string`)
        valid = false
    }
    if (typeof value.targetShapeId !== 'string' || value.targetShapeId.trim() === '') {
        errors.push(`${path}.targetShapeId must be a non-empty string`)
        valid = false
    }
    if (!ANCHOR_POSITIONS.includes(value.sourceAnchor as (typeof ANCHOR_POSITIONS)[number])) {
        errors.push(`${path}.sourceAnchor must be one of ${ANCHOR_POSITIONS.join(', ')}`)
        valid = false
    }
    if (!ANCHOR_POSITIONS.includes(value.targetAnchor as (typeof ANCHOR_POSITIONS)[number])) {
        errors.push(`${path}.targetAnchor must be one of ${ANCHOR_POSITIONS.join(', ')}`)
        valid = false
    }
    if (value.resourceMapping !== null) {
        const mapping = value.resourceMapping
        if (
            !isPlainObject(mapping) ||
            typeof mapping.sourceResource !== 'string' ||
            typeof mapping.targetResource !== 'string'
        ) {
            errors.push(`${path}.resourceMapping must be null or { sourceResource: string, targetResource: string }`)
            valid = false
        }
    }
    if (value.gate !== null && !isGateConfig(value.gate, `${path}.gate`, errors)) {
        valid = false
    }
    return valid
}

export function isGameMechanicSchema(data: unknown, errors: string[]): data is GameMechanicSchema {
    if (!isPlainObject(data)) {
        errors.push('Schema must be a JSON object')
        return false
    }
    let valid = true

    if (data.schemaVersion !== 1) {
        errors.push('schemaVersion must be 1 (unsupported or missing schema version)')
        valid = false
    }

    const viewSettings = data.viewSettings
    if (!isPlainObject(viewSettings)) {
        errors.push('viewSettings must be an object')
        valid = false
    } else {
        const canvasSize = viewSettings.canvasSize
        if (!isPlainObject(canvasSize) || !isFiniteNumber(canvasSize.width) || !isFiniteNumber(canvasSize.height)) {
            errors.push('viewSettings.canvasSize must be { width: number, height: number }')
            valid = false
        }
        const viewport = viewSettings.viewport
        if (
            !isPlainObject(viewport) ||
            !isFiniteNumber(viewport.x) ||
            !isFiniteNumber(viewport.y) ||
            !isFiniteNumber(viewport.zoom)
        ) {
            errors.push('viewSettings.viewport must be { x: number, y: number, zoom: number }')
            valid = false
        }
    }

    if (!Array.isArray(data.units)) {
        errors.push('units must be an array')
        valid = false
    } else {
        if (!data.units.map((unit, index) => isUnit(unit, `units[${index}]`, errors)).every(Boolean)) {
            valid = false
        }
        const names = new Set<string>()
        for (const unit of data.units as Unit[]) {
            if (unit && typeof unit.name === 'string') {
                const normalizedName = unit.name.trim().toLowerCase()
                if (names.has(normalizedName)) {
                    errors.push(`units contains a duplicate name: "${unit.name}" (unit names must be unique)`)
                    valid = false
                }
                names.add(normalizedName)
            }
        }
    }

    if (!Array.isArray(data.connections)) {
        errors.push('connections must be an array')
        valid = false
    } else if (
        !data.connections
            .map((connection, index) => isConnection(connection, `connections[${index}]`, errors))
            .every(Boolean)
    ) {
        valid = false
    }

    return valid
}

export function parseAndValidateSchema(rawText: string): SchemaValidationResult {
    let data: unknown
    try {
        data = JSON.parse(rawText)
    } catch (error) {
        return { ok: false, errors: [`Invalid JSON: ${(error as Error).message}`] }
    }

    const errors: string[] = []
    if (!isGameMechanicSchema(data, errors)) {
        return { ok: false, errors }
    }
    return { ok: true, schema: data }
}
