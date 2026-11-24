export type AnchorPosition = 'top' | 'right' | 'bottom' | 'left'

export interface Position2D {
    x: number
    y: number
}

export interface CanvasSize {
    width: number
    height: number
}

/** Mirrors React Flow's Viewport type ({x,y,zoom}) field-for-field. */
export interface Viewport {
    x: number
    y: number
    zoom: number
}

export interface ViewSettings {
    /** Nominal logical drawing-area size, stored for export fidelity. */
    canvasSize: CanvasSize
    /** Current pan (x,y) + magnification (zoom). */
    viewport: Viewport
}

/** Free-text resource name, no managed catalog. */
export interface ResourceAmount {
    resource: string
    amount: number
}

export type UnitType = 'ioProcess' | 'storage'

export interface UnitBase {
    id: string
    /** Must be unique across GameMechanicSchema.units. */
    name: string
    position: Position2D
}

export interface IOProcessUnitProperties {
    /** Seconds per batch. */
    cycleTimeSeconds: number
    inputs: ResourceAmount[]
    outputs: ResourceAmount[]
    /** 0-4 workers. */
    workerCount: number
    powerConsumptionKw: number
    /** Currency cost per minute. */
    operatingCostPerMinute: number
}

export interface IOProcessUnit extends UnitBase {
    type: 'ioProcess'
    properties: IOProcessUnitProperties
}

export type OverflowRule = 'haltProduction' | 'spillWaste' | 'autoSellSurplus'

export type StockpilePriority = 'high' | 'normal' | 'low' | 'reject'

export interface StockpileFilter {
    resource: string
    priority: StockpilePriority
}

export interface StorageUnitProperties {
    capacity: {
        isInfinite: boolean
        /** Retained even while isInfinite is true, so toggling it back off restores the last value. */
        maxUnits: number
    }
    serviceRadiusMeters: number
    /** 0-8 haulers. */
    haulerCount: number
    overflowRule: OverflowRule
    stockpileFilters: StockpileFilter[]
}

export interface StorageUnit extends UnitBase {
    type: 'storage'
    properties: StorageUnitProperties
}

export type Unit = IOProcessUnit | StorageUnit

export interface ConnectionResourceMapping {
    sourceResource: string
    targetResource: string
}

export interface Connection {
    id: string
    sourceShapeId: string
    sourceAnchor: AnchorPosition
    targetShapeId: string
    targetAnchor: AnchorPosition
    /** Set via the edge-click popover; null until the user configures it. */
    resourceMapping: ConnectionResourceMapping | null
}

export interface GameMechanicSchema {
    /** Bumped on breaking shape changes, enabling precise "unsupported version" errors. */
    schemaVersion: 1
    viewSettings: ViewSettings
    units: Unit[]
    connections: Connection[]
}
