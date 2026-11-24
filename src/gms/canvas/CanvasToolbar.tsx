import React from 'react'
import { Panel } from '@xyflow/react'
import { Button, Stack } from '@mui/material'
import ImportExportIcon from '@mui/icons-material/ImportExport'
import AddIcon from '@mui/icons-material/Add'

interface CanvasToolbarProps {
    onOpenImportExport: () => void
    onOpenNewUnit: () => void
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ onOpenImportExport, onOpenNewUnit }) => {
    return (
        <Panel position="top-left">
            <Stack direction="row" spacing={1}>
                <Button
                    variant="outlined"
                    startIcon={<ImportExportIcon />}
                    onClick={onOpenImportExport}
                    sx={{ bgcolor: 'background.paper' }}
                >
                    Import / Export
                </Button>
                <Button variant="contained" startIcon={<AddIcon />} onClick={onOpenNewUnit}>
                    New Unit
                </Button>
            </Stack>
        </Panel>
    )
}

export default CanvasToolbar
