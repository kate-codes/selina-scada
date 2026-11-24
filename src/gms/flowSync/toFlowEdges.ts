import { Connection } from '../schema/types'
import { ConnectionFlowEdge } from './flowTypes'

function toRfEdge(connection: Connection): ConnectionFlowEdge {
    return {
        id: connection.id,
        source: connection.sourceShapeId,
        sourceHandle: connection.sourceAnchor,
        target: connection.targetShapeId,
        targetHandle: connection.targetAnchor,
        data: { mapping: connection.resourceMapping },
    }
}

export function toFlowEdges(connections: Connection[]): ConnectionFlowEdge[] {
    return connections.map(toRfEdge)
}

export function mergeConnectionsIntoFlowEdges(
    previousEdges: ConnectionFlowEdge[],
    connections: Connection[],
): ConnectionFlowEdge[] {
    const previousById = new Map(previousEdges.map((edge) => [edge.id, edge]))
    return connections.map((connection) => {
        const previous = previousById.get(connection.id)
        if (!previous) {
            return toRfEdge(connection)
        }
        return { ...previous, data: { mapping: connection.resourceMapping } }
    })
}
