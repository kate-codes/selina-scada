import React, { useEffect, useRef, useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import UploadIcon from '@mui/icons-material/Upload'
import { useReactFlow } from '@xyflow/react'
import { parseAndValidateSchema } from '../schema/validate'
import { useGmsStore } from '../state/GmsContext'
import { copyTextToClipboard, downloadJsonFile, readUploadedJsonFile, slugifyFilename } from '../utils/clipboardAndFile'

interface ImportExportDialogProps {
    onClose: () => void
}

/** The JSON draft (`text`) is otherwise frozen from when the dialog opened, so a
 *  rename through the live "Schema name" field above it would silently get reverted
 *  by Apply — which commits `text`, not the live schema — once it goes stale. This
 *  keeps the draft's embedded `name` following the live one, without touching
 *  anything else the user may be mid-editing in the JSON itself. */
function useSyncDraftName(liveName: string, setDraftText: React.Dispatch<React.SetStateAction<string>>) {
    const lastSyncedNameRef = useRef(liveName)

    useEffect(() => {
        if (liveName === lastSyncedNameRef.current) return
        lastSyncedNameRef.current = liveName
        setDraftText((currentText) => {
            try {
                const parsed = JSON.parse(currentText)
                parsed.name = liveName
                return JSON.stringify(parsed, null, 2)
            } catch {
                return currentText // mid-invalid-edit; Apply will surface its own error
            }
        })
    }, [liveName, setDraftText])
}

const ImportExportDialog: React.FC<ImportExportDialogProps> = ({ onClose }) => {
    const { gms, dispatch } = useGmsStore()
    const { setViewport } = useReactFlow()
    const [text, setText] = useState(() => JSON.stringify(gms, null, 2))
    const [errors, setErrors] = useState<string[]>([])
    const [copied, setCopied] = useState(false)
    useSyncDraftName(gms.name, setText)

    function handleApply() {
        const result = parseAndValidateSchema(text)
        if (!result.ok) {
            setErrors(result.errors)
            return
        }
        setErrors([])
        dispatch({ type: 'schema/replace', schema: result.schema })
        setViewport(result.schema.viewSettings.viewport)
        onClose()
    }

    async function handleCopy() {
        await copyTextToClipboard(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    function handleDownload() {
        downloadJsonFile(`${slugifyFilename(gms.name, 'gms-schema')}.json`, text)
    }

    async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return
        const contents = await readUploadedJsonFile(file)
        setText(contents)
        setErrors([])
        event.target.value = ''
    }

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Import / Export Schema</DialogTitle>
            <DialogContent>
                <Stack spacing={1.5}>
                    <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                            Schema name
                        </Typography>
                        <TextField
                            value={gms.name}
                            onChange={(event) => dispatch({ type: 'schema/rename', name: event.target.value })}
                            placeholder="Untitled GMS"
                            size="small"
                            fullWidth
                        />
                    </Stack>
                    <TextField
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        multiline
                        minRows={16}
                        maxRows={24}
                        fullWidth
                        spellCheck={false}
                        InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
                    />
                    {errors.length > 0 && (
                        <Alert severity="error" sx={{ whiteSpace: 'pre-wrap' }}>
                            {errors.join('\n')}
                        </Alert>
                    )}
                    {copied && <Alert severity="success">Copied to clipboard</Alert>}
                    <Stack direction="row" spacing={1}>
                        <Button startIcon={<ContentCopyIcon />} onClick={handleCopy}>
                            Copy
                        </Button>
                        <Button startIcon={<DownloadIcon />} onClick={handleDownload}>
                            Download .json
                        </Button>
                        <Button component="label" startIcon={<UploadIcon />}>
                            Upload .json
                            <input type="file" accept="application/json" hidden onChange={handleUpload} />
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
                <Button variant="contained" onClick={handleApply}>
                    Apply
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default ImportExportDialog
