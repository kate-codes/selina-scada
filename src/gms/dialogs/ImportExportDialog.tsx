import React, { useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import UploadIcon from '@mui/icons-material/Upload'
import { useReactFlow } from '@xyflow/react'
import { parseAndValidateSchema } from '../schema/validate'
import { useGmsStore } from '../state/GmsContext'
import { copyTextToClipboard, downloadJsonFile, readUploadedJsonFile } from '../utils/clipboardAndFile'

interface ImportExportDialogProps {
    onClose: () => void
}

const ImportExportDialog: React.FC<ImportExportDialogProps> = ({ onClose }) => {
    const { gms, dispatch } = useGmsStore()
    const { setViewport } = useReactFlow()
    const [text, setText] = useState(() => JSON.stringify(gms, null, 2))
    const [errors, setErrors] = useState<string[]>([])
    const [copied, setCopied] = useState(false)

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
        downloadJsonFile('gms-schema.json', text)
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
