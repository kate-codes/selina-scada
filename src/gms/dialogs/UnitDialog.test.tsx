import { ReactFlowProvider } from '@xyflow/react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createDefaultStorageProperties, createEmptySchema } from '../schema/defaults'
import { GameMechanicSchema } from '../schema/types'
import { GmsProvider } from '../state/GmsContext'
import UnitDialog from './UnitDialog'

function renderDialog(initialSchema?: GameMechanicSchema) {
    render(
        <ReactFlowProvider>
            <GmsProvider initialSchema={initialSchema}>
                <UnitDialog editingUnit={null} onClose={() => {}} />
            </GmsProvider>
        </ReactFlowProvider>,
    )
}

describe('UnitDialog name validation', () => {
    it('keeps focus on the name field and shows a required error when creating an IO Process unit without a name', () => {
        renderDialog()

        fireEvent.click(screen.getByRole('button', { name: /I\/O Process Unit/i }))

        const nameInput = screen.getByRole('textbox', { name: /unit name/i })
        fireEvent.click(screen.getByRole('button', { name: /create/i }))

        expect(nameInput).toHaveFocus()
        expect(screen.getByText('Name is required')).toBeInTheDocument()
    })

    it('rejects a name that already belongs to another unit, with a clear explanation', () => {
        const schema: GameMechanicSchema = {
            ...createEmptySchema(),
            units: [
                {
                    id: 'unit-1',
                    type: 'storage',
                    name: 'Warehouse',
                    position: { x: 0, y: 0 },
                    properties: createDefaultStorageProperties(),
                },
            ],
        }
        renderDialog(schema)

        fireEvent.click(screen.getByRole('button', { name: /I\/O Process Unit/i }))

        const nameInput = screen.getByRole('textbox', { name: /unit name/i })
        fireEvent.change(nameInput, { target: { value: 'Warehouse' } })
        fireEvent.click(screen.getByRole('button', { name: /create/i }))

        expect(nameInput).toHaveFocus()
        expect(
            screen.getByText('A unit named "Warehouse" already exists. Please choose a unique name.'),
        ).toBeInTheDocument()
    })
})
