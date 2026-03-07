import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import ProfilesPage from '../pages/ProfilesPage';
import ProfileUpsertPage from '../pages/ProfileUpsertPage';
import SqlParametersPage from '../pages/SqlParametersPage';
import TestCaseResultPage from '../pages/TestCaseResultPage';
import TestCaseUpsertPage from '../pages/TestCaseUpsertPage';
import TestCasesPage from '../pages/TestCasesPage';

function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography variant="h6" component="h1">
              SQL Compare Tool
            </Typography>
          </Link>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={<Navigate to="/profiles" replace />} />
        <Route
          path="/profiles/:profileId/test-cases/:testCaseId/results"
          element={
            <Box sx={{ px: '12px', py: 4 }}>
              <TestCaseResultPage />
            </Box>
          }
        />
        <Route
          path="*"
          element={
            <Container maxWidth="lg" sx={{ py: 4 }}>
              <Routes>
                <Route path="/profiles" element={<ProfilesPage />} />
                <Route path="/profiles/new" element={<ProfileUpsertPage />} />
                <Route path="/profiles/:id" element={<ProfileUpsertPage />} />
                <Route path="/profiles/:profileId/parameters" element={<SqlParametersPage />} />
                <Route path="/profiles/:profileId/test-cases" element={<TestCasesPage />} />
                <Route
                  path="/profiles/:profileId/test-cases/new"
                  element={<TestCaseUpsertPage />}
                />
                <Route
                  path="/profiles/:profileId/test-cases/:testCaseId/edit"
                  element={<TestCaseUpsertPage />}
                />
              </Routes>
            </Container>
          }
        />
      </Routes>
    </Box>
  );
}

export default App;
