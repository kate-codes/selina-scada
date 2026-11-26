import {
    Connection,
    ConnectionResourceMapping,
    GameMechanicSchema,
    GateConfig,
    IOProcessUnitProperties,
    Position2D,
    StorageUnitProperties,
    Unit,
    Viewport,
} from '../schema/types'

export type GmsAction =
    | { type: 'unit/add'; unit: Unit }
    | { type: 'unit/update'; id: string; name: string; properties: Unit['properties'] }
    | { type: 'unit/move'; id: string; position: Position2D }
    | { type: 'unit/remove'; ids: string[] }
    | { type: 'connection/add'; connection: Connection }
    | { type: 'connection/remove'; ids: string[] }
    | { type: 'connection/setMapping'; id: string; mapping: ConnectionResourceMapping | null }
    | { type: 'connection/setGate'; id: string; gate: GateConfig | null }
    | { type: 'viewport/commit'; viewport: Viewport }
    | { type: 'schema/replace'; schema: GameMechanicSchema }

function applyUnitUpdate(unit: Unit, name: string, properties: Unit['properties']): Unit {
    if (unit.type === 'ioProcess') {
        return { ...unit, name, properties: properties as IOProcessUnitProperties }
    }
    return { ...unit, name, properties: properties as StorageUnitProperties }
}

export function gmsReducer(state: GameMechanicSchema, action: GmsAction): GameMechanicSchema {
    switch (action.type) {
        case 'unit/add':
            return { ...state, units: [...state.units, action.unit] }

        case 'unit/update':
            return {
                ...state,
                units: state.units.map((unit) =>
                    unit.id === action.id ? applyUnitUpdate(unit, action.name, action.properties) : unit,
                ),
            }

        case 'unit/move':
            return {
                ...state,
                units: state.units.map((unit) =>
                    unit.id === action.id ? { ...unit, position: action.position } : unit,
                ),
            }

        case 'unit/remove':
            return {
                ...state,
                units: state.units.filter((unit) => !action.ids.includes(unit.id)),
                connections: state.connections.filter(
                    (connection) =>
                        !action.ids.includes(connection.sourceShapeId) &&
                        !action.ids.includes(connection.targetShapeId),
                ),
            }

        case 'connection/add':
            return { ...state, connections: [...state.connections, action.connection] }

        case 'connection/remove':
            return { ...state, connections: state.connections.filter((c) => !action.ids.includes(c.id)) }

        case 'connection/setMapping':
            return {
                ...state,
                connections: state.connections.map((c) =>
                    c.id === action.id ? { ...c, resourceMapping: action.mapping } : c,
                ),
            }

        case 'connection/setGate':
            return {
                ...state,
                connections: state.connections.map((c) =>
                    c.id === action.id ? { ...c, gate: action.gate } : c,
                ),
            }

        case 'viewport/commit':
            return { ...state, viewSettings: { ...state.viewSettings, viewport: action.viewport } }

        case 'schema/replace':
            return action.schema

        default:
            return state
    }
}
