import React from 'react'
import { Panel } from '@xyflow/react'
import { Button, IconButton, Stack, TextField, Tooltip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import ImportExportIcon from '@mui/icons-material/ImportExport'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'

interface CanvasToolbarProps {
    schemaName: string
    onRenameSchema: (name: string) => void
    isNameEditable: boolean
    onOpenImportExport: () => void
    onOpenNewUnit: () => void
    showPlayToggle: boolean
    isPlaying: boolean
    onTogglePlay: () => void
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
    schemaName,
    onRenameSchema,
    isNameEditable,
    onOpenImportExport,
    onOpenNewUnit,
    showPlayToggle,
    isPlaying,
    onTogglePlay,
}) => {
    return (
        <Panel position="top-left">
            <Stack direction="row" spacing={1} alignItems="center">
                <Button
                    variant="outlined"
                    startIcon={<ImportExportIcon />}
                    onClick={onOpenImportExport}
                    disabled={isPlaying}
                    sx={{ bgcolor: 'background.paper' }}
                >
                    Import / Export
                </Button>
                <Button variant="contained" startIcon={<AddIcon />} onClick={onOpenNewUnit} disabled={isPlaying}>
                    New Unit
                </Button>
                {showPlayToggle && (
                    <Tooltip title={isPlaying ? 'Pause' : 'Play'}>
                        <IconButton
                            aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
                            onClick={onTogglePlay}
                            sx={{ bgcolor: 'background.paper' }}
                        >
                            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                    </Tooltip>
                )}
                <TextField
                    value={schemaName}
                    onChange={(event) => onRenameSchema(event.target.value)}
                    disabled={!isNameEditable}
                    placeholder="Untitled GMS"
                    variant="standard"
                    size="small"
                    aria-label="Schema name"
                    inputProps={{ maxLength: 100 }}
                    sx={{
                        width: 320,
                        bgcolor: 'background.paper',
                        px: 1,
                        borderRadius: 1,
                        '& .MuiInput-underline:before': { borderBottomStyle: 'dashed' },
                    }}
                    InputProps={{ sx: { fontWeight: 500 } }}
                />
            </Stack>
        </Panel>
    )
}

export default CanvasToolbar
