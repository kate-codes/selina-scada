import React from 'react'
import { Box, Popover, Stack, Typography } from '@mui/material'
import ResourceNameAutocomplete from '../components/ResourceNameAutocomplete'
import { useResourceNameSuggestions } from '../hooks/useResourceNameSuggestions'
import { useGmsStore } from '../state/GmsContext'

interface EdgeResourceMappingPopoverProps {
    edgeId: string
    anchorPosition: { top: number; left: number }
    onClose: () => void
}

const EdgeResourceMappingPopover: React.FC<EdgeResourceMappingPopoverProps> = ({
    edgeId,
    anchorPosition,
    onClose,
}) => {
    const { gms, dispatch } = useGmsStore()
    const resourceSuggestions = useResourceNameSuggestions()
    const connection = gms.connections.find((c) => c.id === edgeId)

    if (!connection) return null

    const mapping = connection.resourceMapping ?? { sourceResource: '', targetResource: '' }

    function updateMapping(patch: Partial<typeof mapping>) {
        dispatch({
            type: 'connection/setMapping',
            id: edgeId,
            mapping: { ...mapping, ...patch },
        })
    }

    return (
        <Popover
            open
            onClose={onClose}
            anchorReference="anchorPosition"
            anchorPosition={anchorPosition}
            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
            <Box sx={{ p: 2, width: 320 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Resource Link
                </Typography>
                <Stack spacing={1.5}>
                    <ResourceNameAutocomplete
                        label="Source resource"
                        value={mapping.sourceResource}
                        onChange={(value) => updateMapping({ sourceResource: value })}
                        suggestions={resourceSuggestions}
                    />
                    <ResourceNameAutocomplete
                        label="Target resource"
                        value={mapping.targetResource}
                        onChange={(value) => updateMapping({ targetResource: value })}
                        suggestions={resourceSuggestions}
                    />
                </Stack>
            </Box>
        </Popover>
    )
}

export default EdgeResourceMappingPopover
