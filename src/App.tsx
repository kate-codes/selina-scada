import React from 'react'
import { Box, CssBaseline, ThemeProvider } from '@mui/material'
import GmsEditorPage from './gms/GmsEditorPage'
import { theme } from './theme/theme'

const App: React.FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
                <GmsEditorPage />
            </Box>
        </ThemeProvider>
    )
}

export default App
