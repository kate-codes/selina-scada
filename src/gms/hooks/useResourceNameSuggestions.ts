import { useMemo } from 'react'
import { useGmsStore } from '../state/GmsContext'

export function useResourceNameSuggestions(): string[] {
    const { gms } = useGmsStore()

    return useMemo(() => {
        const names = new Set<string>()
        for (const unit of gms.units) {
            if (unit.type === 'ioProcess') {
                unit.properties.inputs.forEach((row) => names.add(row.resource))
                unit.properties.outputs.forEach((row) => names.add(row.resource))
            } else {
                unit.properties.stockpileFilters.forEach((row) => names.add(row.resource))
            }
        }
        for (const connection of gms.connections) {
            if (connection.resourceMapping) {
                names.add(connection.resourceMapping.sourceResource)
                names.add(connection.resourceMapping.targetResource)
            }
        }
        return Array.from(names)
            .filter((name) => name.trim() !== '')
            .sort()
    }, [gms.units, gms.connections])
}
