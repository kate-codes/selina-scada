import React, { useState } from 'react'
import { Box } from '@mui/material'
import { ReactFlowProvider } from '@xyflow/react'
import GmsCanvas from './canvas/GmsCanvas'
import ImportExportDialog from './dialogs/ImportExportDialog'
import UnitDialog from './dialogs/UnitDialog'
import EdgeResourceMappingPopover from './popovers/EdgeResourceMappingPopover'
import { Unit } from './schema/types'
import { GmsProvider } from './state/GmsContext'

type ActiveOverlay =
    | { kind: 'none' }
    | { kind: 'unitDialog'; editingUnit: Unit | null }
    | { kind: 'importExport' }
    | { kind: 'edgePopover'; edgeId: string; anchorPosition: { top: number; left: number } }

const GmsEditorPageInner: React.FC = () => {
    const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>({ kind: 'none' })
    const closeOverlay = () => setActiveOverlay({ kind: 'none' })

    return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <GmsCanvas
                onEditUnit={(unit) => setActiveOverlay({ kind: 'unitDialog', editingUnit: unit })}
                onEdgeClick={(edgeId, anchorPosition) =>
                    setActiveOverlay({ kind: 'edgePopover', edgeId, anchorPosition })
                }
                onOpenImportExport={() => setActiveOverlay({ kind: 'importExport' })}
                onOpenNewUnit={() => setActiveOverlay({ kind: 'unitDialog', editingUnit: null })}
                activePopoverEdgeId={activeOverlay.kind === 'edgePopover' ? activeOverlay.edgeId : null}
                isImportExportOpen={activeOverlay.kind === 'importExport'}
            />

            {activeOverlay.kind === 'unitDialog' && (
                <UnitDialog editingUnit={activeOverlay.editingUnit} onClose={closeOverlay} />
            )}
            {activeOverlay.kind === 'importExport' && <ImportExportDialog onClose={closeOverlay} />}
            {activeOverlay.kind === 'edgePopover' && (
                <EdgeResourceMappingPopover
                    edgeId={activeOverlay.edgeId}
                    anchorPosition={activeOverlay.anchorPosition}
                    onClose={closeOverlay}
                />
            )}
        </Box>
    )
}

const GmsEditorPage: React.FC = () => {
    return (
        <GmsProvider>
            <ReactFlowProvider>
                <GmsEditorPageInner />
            </ReactFlowProvider>
        </GmsProvider>
    )
}

export default GmsEditorPage
