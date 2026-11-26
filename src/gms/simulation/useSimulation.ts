import { useCallback, useEffect, useRef, useState } from 'react'
import { GameMechanicSchema } from '../schema/types'
import { createInitialSimulationState, stepSimulation } from './simulationEngine'
import { SimulationState, isIoProcessRuntimeState } from './simulationTypes'

// Caps how far a single frame can advance the sim, so a backgrounded/throttled tab
// doesn't fast-forward the whole elapsed time the moment it regains focus.
const MAX_FRAME_DT_SECONDS = 0.25

export interface SimulationController {
    isPlaying: boolean
    simulationState: SimulationState
    togglePlay: () => void
    setGateOpen: (connectionId: string, isOpen: boolean) => void
    setLiveWorkerCount: (unitId: string, count: number) => void
    setLiveHaulerCount: (unitId: string, count: number) => void
}

export function useSimulation(schema: GameMechanicSchema): SimulationController {
    const [isPlaying, setIsPlaying] = useState(false)
    const [simulationState, setSimulationState] = useState<SimulationState>(() =>
        createInitialSimulationState(schema),
    )

    const schemaRef = useRef(schema)
    schemaRef.current = schema

    // Structural edits (the only kind possible while not playing) re-seed the sim from
    // scratch rather than reconciling in place — simpler, at the cost of losing
    // in-flight stock across an edit, which is fine for a paused work-in-progress.
    const seenSchemaRef = useRef(schema)
    useEffect(() => {
        if (isPlaying || seenSchemaRef.current === schema) return
        seenSchemaRef.current = schema
        setSimulationState(createInitialSimulationState(schema))
    }, [schema, isPlaying])

    useEffect(() => {
        if (!isPlaying) return
        let frameId: number
        let lastTime = performance.now()
        const tick = (now: number) => {
            const dt = Math.min(MAX_FRAME_DT_SECONDS, (now - lastTime) / 1000)
            lastTime = now
            setSimulationState((previous) => stepSimulation(schemaRef.current, previous, dt))
            frameId = requestAnimationFrame(tick)
        }
        frameId = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameId)
    }, [isPlaying])

    const togglePlay = useCallback(() => setIsPlaying((previous) => !previous), [])

    const setGateOpen = useCallback((connectionId: string, isOpen: boolean) => {
        setSimulationState((previous) => ({
            ...previous,
            gates: { ...previous.gates, [connectionId]: { ...previous.gates[connectionId], isOpen } },
        }))
    }, [])

    const setLiveWorkerCount = useCallback((unitId: string, count: number) => {
        setSimulationState((previous) =>
            updateUnitRuntime(previous, unitId, (runtime) =>
                isIoProcessRuntimeState(runtime) ? { ...runtime, liveWorkerCount: count } : runtime,
            ),
        )
    }, [])

    const setLiveHaulerCount = useCallback((unitId: string, count: number) => {
        setSimulationState((previous) =>
            updateUnitRuntime(previous, unitId, (runtime) =>
                !isIoProcessRuntimeState(runtime) ? { ...runtime, liveHaulerCount: count } : runtime,
            ),
        )
    }, [])

    return { isPlaying, simulationState, togglePlay, setGateOpen, setLiveWorkerCount, setLiveHaulerCount }
}

function updateUnitRuntime(
    state: SimulationState,
    unitId: string,
    updater: (runtime: SimulationState['units'][string]) => SimulationState['units'][string],
): SimulationState {
    const runtime = state.units[unitId]
    if (!runtime) return state
    return { ...state, units: { ...state.units, [unitId]: updater(runtime) } }
}
