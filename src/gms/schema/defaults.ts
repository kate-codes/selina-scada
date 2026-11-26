import { DEFAULT_CANVAS_SIZE, DEFAULT_VIEWPORT } from '../constants'
import {
    GameMechanicSchema,
    GateConfig,
    GateKind,
    IOProcessUnitProperties,
    Position2D,
    StorageUnitProperties,
} from './types'

export function createId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`
}

export function createEmptySchema(): GameMechanicSchema {
    return {
        schemaVersion: 1,
        viewSettings: {
            canvasSize: { ...DEFAULT_CANVAS_SIZE },
            viewport: { ...DEFAULT_VIEWPORT },
        },
        units: [],
        connections: [],
    }
}

export function createDefaultIOProcessProperties(): IOProcessUnitProperties {
    return {
        cycleTimeSeconds: 0,
        inputs: [],
        outputs: [],
        workerCount: 0,
        powerConsumptionKw: 0,
        operatingCostPerMinute: 0,
    }
}

export function createDefaultStorageProperties(): StorageUnitProperties {
    return {
        capacity: { isInfinite: false, maxUnits: 0 },
        serviceRadiusMeters: 0,
        haulerCount: 0,
        overflowRule: 'haltProduction',
        stockpileFilters: [],
    }
}

export function createDefaultGateConfig(kind: GateKind): GateConfig {
    switch (kind) {
        case 'interactive':
            return { kind: 'interactive', isOpen: true }
        case 'random':
            return {
                kind: 'random',
                outcomes: [
                    { resource: '', weight: 50 },
                    { resource: '', weight: 50 },
                ],
            }
        case 'deterministic':
            return {
                kind: 'deterministic',
                conditionResource: '',
                operator: '>',
                threshold: 0,
                thenResource: '',
                elseResource: '',
            }
        case 'automatic':
            return {
                kind: 'automatic',
                intervalSeconds: 10,
                outcomes: [
                    { resource: '', weight: 50 },
                    { resource: '', weight: 50 },
                ],
            }
    }
}

let creationCount = 0

const GRID_COLUMNS = 4
const GRID_SPACING_X = 260
const GRID_SPACING_Y = 180

/** Fans out repeated new-unit placements in a grid around a center point, spaced wider
 *  than a unit card (~220x140) so sequential creations never visually overlap. */
export function nextStaggeredPosition(center: Position2D): Position2D {
    const column = creationCount % GRID_COLUMNS
    const row = Math.floor(creationCount / GRID_COLUMNS)
    creationCount += 1
    return {
        x: center.x - 90 + column * GRID_SPACING_X,
        y: center.y - 60 + row * GRID_SPACING_Y,
    }
}
