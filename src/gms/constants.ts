import { AnchorPosition } from './schema/types'

export const ANCHOR_POSITIONS: AnchorPosition[] = ['top', 'right', 'bottom', 'left']

export const PORT_ACTIVE_COLOR = '#b388ff'
export const PORT_IDLE_COLOR = '#9e9e9e'

export const EDGE_IDLE_COLOR = '#9e9e9e'
export const EDGE_SELECTED_COLOR = '#b388ff'

export const DEFAULT_CANVAS_SIZE = { width: 4000, height: 3000 }
export const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 }

export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 2

export const CONNECTION_RADIUS = 32

export const UNIT_TYPE_LABELS: Record<'ioProcess' | 'storage', string> = {
    ioProcess: 'I/O Process Unit',
    storage: 'Storage Unit',
}

export const UNIT_TYPE_DESCRIPTIONS: Record<'ioProcess' | 'storage', string> = {
    ioProcess:
        'Raw materials converted through multi-tier refinement steps (e.g., Timber -> Planks -> Furniture).',
    storage:
        'Stockpiling & Warehousing with optional capacity limits that require storage depots near production hubs.',
}
