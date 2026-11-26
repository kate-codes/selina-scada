/** Runtime-only simulation state. Never part of `GameMechanicSchema` and never
 *  persisted/exported — it's recomputed fresh from the schema each time Play starts
 *  from a stop, so a play session can never corrupt the saved design. */

export interface IoProcessRuntimeState {
    /** resource -> amount held, pending a full batch of `properties.inputs`. */
    inputBuffers: Record<string, number>
    /** resource -> amount produced, pending transfer out across a connection. */
    outputBuffers: Record<string, number>
    cycleProgressSeconds: number
    /** Ephemeral override, seeded from `properties.workerCount`; never written back. */
    liveWorkerCount: number
}

export interface StorageRuntimeState {
    stock: Record<string, number>
    /** Ephemeral override, seeded from `properties.haulerCount`; never written back. */
    liveHaulerCount: number
}

export type UnitRuntimeState = IoProcessRuntimeState | StorageRuntimeState

export function isIoProcessRuntimeState(runtime: UnitRuntimeState): runtime is IoProcessRuntimeState {
    return 'inputBuffers' in runtime
}

export interface GateRuntimeState {
    /** interactive only; seeded from `gate.isOpen`, flipped live via the canvas toggle. */
    isOpen?: boolean
    /** automatic only; counts up to `intervalSeconds` before firing. */
    timerSeconds?: number
}

export interface FlowReading {
    /** The resource actually delivered this tick, or null if nothing moved. */
    resource: string | null
    amount: number
}

export interface SimulationState {
    elapsedSeconds: number
    /** Keyed by unit id. */
    units: Record<string, UnitRuntimeState>
    /** Keyed by connection id. Only present for interactive/automatic gates. */
    gates: Record<string, GateRuntimeState>
    /** Keyed by connection id, one entry per connection. */
    flows: Record<string, FlowReading>
}
