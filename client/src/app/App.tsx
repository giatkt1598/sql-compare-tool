import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProfilesPage from '../pages/ProfilesPage';
import ProfileUpsertPage from '../pages/ProfileUpsertPage';
import SqlParametersPage from '../pages/SqlParametersPage';
import TestCaseUpsertPage from '../pages/TestCaseUpsertPage';
import TestCasesPage from '../pages/TestCasesPage';

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
          <Route path="/profiles/:profileId/parameters" element={<SqlParametersPage />} />
          <Route path="/profiles/:profileId/test-cases" element={<TestCasesPage />} />
          <Route path="/profiles/:profileId/test-cases/new" element={<TestCaseUpsertPage />} />
          <Route
            path="/profiles/:profileId/test-cases/:testCaseId"
            element={<TestCaseUpsertPage />}
          />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;
