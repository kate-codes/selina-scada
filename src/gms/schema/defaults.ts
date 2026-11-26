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
        name: 'Untitled GMS',
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

export interface VisibleFlowBounds {
    /** Flow-space position of the viewport's top-left corner (zoom/pan already applied). */
    topLeft: Position2D
    /** Flow-space position of the viewport's bottom-right corner. */
    bottomRight: Position2D
}

let creationCount = 0

const GRID_COLUMNS = 4
const GRID_ROWS = 3
const MAX_SPACING_X = 260
const MAX_SPACING_Y = 180
// Half a unit card's flow-space footprint (~220x140), used to keep the whole card
// inside the visible area rather than just its center point.
const NODE_HALF_WIDTH = 110
const NODE_HALF_HEIGHT = 70

/** Fans out repeated new-unit placements in a grid centered on the currently visible
 *  canvas area. Both the grid's step size and its wraparound are derived from
 *  `bounds` (the flow-space rect `screenToFlowPosition` reports for the current pan
 *  *and zoom*) rather than fixed pixel offsets, so:
 *  - zoomed in, where the visible flow-space area is much smaller, the grid packs
 *    its 4x3 slots tighter instead of spilling the fixed-size step past what's
 *    visible, and
 *  - after the grid fills (12 creations), it wraps back to the first slot instead of
 *    drifting further from center with every unit ever created in the session.
 *  A final clamp is a safety net for extreme zoom, guaranteeing the card itself (not
 *  just its anchor point) stays within the visible rect. */
export function nextStaggeredPosition(bounds: VisibleFlowBounds): Position2D {
    const { topLeft, bottomRight } = bounds
    const visibleWidth = bottomRight.x - topLeft.x
    const visibleHeight = bottomRight.y - topLeft.y

    const spacingX = Math.min(MAX_SPACING_X, visibleWidth / GRID_COLUMNS)
    const spacingY = Math.min(MAX_SPACING_Y, visibleHeight / GRID_ROWS)

    const slot = creationCount % (GRID_COLUMNS * GRID_ROWS)
    creationCount += 1
    const column = slot % GRID_COLUMNS
    const row = Math.floor(slot / GRID_COLUMNS)

    const centerX = (topLeft.x + bottomRight.x) / 2
    const centerY = (topLeft.y + bottomRight.y) / 2
    const gridWidth = (GRID_COLUMNS - 1) * spacingX
    const gridHeight = (GRID_ROWS - 1) * spacingY

    const x = centerX - gridWidth / 2 + column * spacingX
    const y = centerY - gridHeight / 2 + row * spacingY

    return {
        x: clamp(x, topLeft.x + NODE_HALF_WIDTH, bottomRight.x - NODE_HALF_WIDTH),
        y: clamp(y, topLeft.y + NODE_HALF_HEIGHT, bottomRight.y - NODE_HALF_HEIGHT),
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
}
