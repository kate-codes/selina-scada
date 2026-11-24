import { useState } from 'react'
import { createDefaultIOProcessProperties, createDefaultStorageProperties, createId } from '../schema/defaults'
import { IOProcessUnitProperties, Position2D, StorageUnitProperties, Unit, UnitType } from '../schema/types'

export type UnitDialogStep = 'chooser' | 'form'

export function useUnitDialogController(editingUnit: Unit | null) {
    const isEditMode = editingUnit !== null

    const [step, setStep] = useState<UnitDialogStep>(isEditMode ? 'form' : 'chooser')
    const [draftType, setDraftType] = useState<UnitType | null>(editingUnit?.type ?? null)
    const [draftName, setDraftName] = useState<string>(editingUnit?.name ?? '')
    const [draftProperties, setDraftProperties] = useState<Unit['properties'] | null>(
        editingUnit?.properties ?? null,
    )

    function chooseType(type: UnitType) {
        setDraftType(type)
        setDraftProperties(type === 'ioProcess' ? createDefaultIOProcessProperties() : createDefaultStorageProperties())
        setStep('form')
    }

    function buildUnit(newUnitPosition: Position2D): Unit | null {
        if (!draftType || !draftProperties) return null

        if (isEditMode && editingUnit) {
            if (editingUnit.type === 'ioProcess') {
                return { ...editingUnit, name: draftName, properties: draftProperties as IOProcessUnitProperties }
            }
            return { ...editingUnit, name: draftName, properties: draftProperties as StorageUnitProperties }
        }

        const id = createId(draftType)
        if (draftType === 'ioProcess') {
            return {
                id,
                type: 'ioProcess',
                name: draftName,
                position: newUnitPosition,
                properties: draftProperties as IOProcessUnitProperties,
            }
        }
        return {
            id,
            type: 'storage',
            name: draftName,
            position: newUnitPosition,
            properties: draftProperties as StorageUnitProperties,
        }
    }

    return {
        isEditMode,
        step,
        draftType,
        draftName,
        draftProperties,
        setDraftName,
        setDraftProperties,
        chooseType,
        buildUnit,
    }
}
