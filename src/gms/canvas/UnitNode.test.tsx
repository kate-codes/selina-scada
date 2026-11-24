import { ReactFlowProvider } from '@xyflow/react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createDefaultStorageProperties } from '../schema/defaults'
import { StorageUnit } from '../schema/types'
import UnitNode, { UnitNodeProps } from './UnitNode'

function makeUnit(): StorageUnit {
    return {
        id: 'unit-1',
        type: 'storage',
        name: 'Warehouse',
        position: { x: 0, y: 0 },
        properties: createDefaultStorageProperties(),
    }
}

function renderUnitNode(overrides: Partial<UnitNodeProps> = {}) {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const unit = makeUnit()

    const props = {
        id: unit.id,
        data: { unit },
        selected: false,
        onEdit,
        onDelete,
        ...overrides,
    } as unknown as UnitNodeProps

    render(
        <ReactFlowProvider>
            <UnitNode {...props} />
        </ReactFlowProvider>,
    )
    return { onEdit, onDelete, unit }
}

describe('UnitNode', () => {
    it('calls onEdit with the unit when the edit icon is clicked', () => {
        const { onEdit, onDelete, unit } = renderUnitNode()

        fireEvent.click(screen.getByRole('button', { name: /edit unit/i }))

        expect(onEdit).toHaveBeenCalledWith(unit)
        expect(onDelete).not.toHaveBeenCalled()
    })

    it('calls onDelete with the unit when the delete (x) icon is clicked', () => {
        const { onEdit, onDelete, unit } = renderUnitNode()

        fireEvent.click(screen.getByRole('button', { name: /delete unit/i }))

        expect(onDelete).toHaveBeenCalledWith(unit)
        expect(onEdit).not.toHaveBeenCalled()
    })
})
