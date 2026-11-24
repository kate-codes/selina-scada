import React, { createContext, Dispatch, useContext, useReducer } from 'react'
import { createEmptySchema } from '../schema/defaults'
import { GameMechanicSchema } from '../schema/types'
import { GmsAction, gmsReducer } from './gmsReducer'

interface GmsStoreValue {
    gms: GameMechanicSchema
    dispatch: Dispatch<GmsAction>
}

const GmsStoreContext = createContext<GmsStoreValue | null>(null)

export const GmsProvider: React.FC<{ children: React.ReactNode; initialSchema?: GameMechanicSchema }> = ({
    children,
    initialSchema,
}) => {
    const [gms, dispatch] = useReducer(gmsReducer, initialSchema ?? createEmptySchema())

    return <GmsStoreContext.Provider value={{ gms, dispatch }}>{children}</GmsStoreContext.Provider>
}

export function useGmsStore(): GmsStoreValue {
    const context = useContext(GmsStoreContext)
    if (!context) {
        throw new Error('useGmsStore must be used within a GmsProvider')
    }
    return context
}
