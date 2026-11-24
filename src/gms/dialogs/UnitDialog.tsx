import React, { useRef, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import { useReactFlow } from '@xyflow/react'
import { UNIT_TYPE_LABELS } from '../constants'
import { useResourceNameSuggestions } from '../hooks/useResourceNameSuggestions'
import { useUnitDialogController } from '../hooks/useUnitDialogController'
import { nextStaggeredPosition } from '../schema/defaults'
import { IOProcessUnitProperties, StorageUnitProperties, Unit } from '../schema/types'
import { useGmsStore } from '../state/GmsContext'
import IOProcessUnitForm from './IOProcessUnitForm'
import StorageUnitForm from './StorageUnitForm'
import UnitTypeChooserStep from './UnitTypeChooserStep'

interface UnitDialogProps {
    editingUnit: Unit | null
    onClose: () => void
}

const UnitDialog: React.FC<UnitDialogProps> = ({ editingUnit, onClose }) => {
    const { gms, dispatch } = useGmsStore()
    const { screenToFlowPosition } = useReactFlow()
    const resourceSuggestions = useResourceNameSuggestions()
    const controller = useUnitDialogController(editingUnit)
    const [nameError, setNameError] = useState<string | null>(null)
    const nameInputRef = useRef<HTMLInputElement>(null)

    function handleConfirm() {
        const trimmedName = controller.draftName.trim()
        if (!trimmedName) {
            setNameError('Name is required')
            nameInputRef.current?.focus()
            return
        }
        const isDuplicate = gms.units.some(
            (unit) => unit.id !== editingUnit?.id && unit.name.toLowerCase() === trimmedName.toLowerCase(),
        )
        if (isDuplicate) {
            setNameError(`A unit named "${trimmedName}" already exists. Please choose a unique name.`)
            nameInputRef.current?.focus()
            return
        }

        const position = editingUnit
            ? editingUnit.position
            : nextStaggeredPosition(screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 }))
        const unit = controller.buildUnit(position)
        if (!unit) return

        const finalUnit = { ...unit, name: trimmedName }
        if (editingUnit) {
            dispatch({ type: 'unit/update', id: finalUnit.id, name: finalUnit.name, properties: finalUnit.properties })
        } else {
            dispatch({ type: 'unit/add', unit: finalUnit })
        }
        onClose()
    }

    const title = controller.isEditMode
        ? 'Edit Unit'
        : controller.step === 'chooser'
          ? 'New Unit'
          : `New ${controller.draftType ? UNIT_TYPE_LABELS[controller.draftType] : 'Unit'}`

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {controller.step === 'chooser' ? (
                    <UnitTypeChooserStep onChoose={controller.chooseType} />
                ) : (
                    <>
                        <TextField
                            label="Unit Name"
                            required
                            fullWidth
                            margin="normal"
                            inputRef={nameInputRef}
                            value={controller.draftName}
                            error={!!nameError}
                            helperText={nameError ?? ' '}
                            onChange={(event) => {
                                controller.setDraftName(event.target.value)
                                setNameError(null)
                            }}
                        />
                        {controller.draftType === 'ioProcess' && controller.draftProperties && (
                            <IOProcessUnitForm
                                properties={controller.draftProperties as IOProcessUnitProperties}
                                onChange={controller.setDraftProperties}
                                resourceSuggestions={resourceSuggestions}
                            />
                        )}
                        {controller.draftType === 'storage' && controller.draftProperties && (
                            <StorageUnitForm
                                properties={controller.draftProperties as StorageUnitProperties}
                                onChange={controller.setDraftProperties}
                                resourceSuggestions={resourceSuggestions}
                            />
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                {controller.step === 'form' && (
                    <Button variant="contained" onClick={handleConfirm}>
                        {controller.isEditMode ? 'Save' : 'Create'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}

export default UnitDialog
