import React from 'react'
import { Button, Stack, Tooltip } from '@mui/material'
import { UNIT_TYPE_DESCRIPTIONS, UNIT_TYPE_LABELS } from '../constants'
import { UnitType } from '../schema/types'

interface UnitTypeChooserStepProps {
    onChoose: (type: UnitType) => void
}

const UnitTypeChooserStep: React.FC<UnitTypeChooserStepProps> = ({ onChoose }) => {
    return (
        <Stack spacing={2} alignItems="center" sx={{ py: 3 }}>
            {(Object.keys(UNIT_TYPE_LABELS) as UnitType[]).map((type) => (
                <Tooltip key={type} title={UNIT_TYPE_DESCRIPTIONS[type]} placement="right" arrow>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() => onChoose(type)}
                        aria-label={UNIT_TYPE_LABELS[type]}
                        sx={{ width: 280 }}
                    >
                        {UNIT_TYPE_LABELS[type]}
                    </Button>
                </Tooltip>
            ))}
        </Stack>
    )
}

export default UnitTypeChooserStep
