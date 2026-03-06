import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProfilesPage from '../pages/ProfilesPage'
import ProfileUpsertPage from '../pages/ProfileUpsertPage'

function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="h1">
            SQL Comparer
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/profiles" replace />} />
          <Route path="/profiles" element={<ProfilesPage />} />
          <Route path="/profiles/new" element={<ProfileUpsertPage />} />
          <Route path="/profiles/:id" element={<ProfileUpsertPage />} />
        </Routes>
      </Container>
    </Box>
  )
}

export default App
