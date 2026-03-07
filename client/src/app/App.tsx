import { AppBar, Box, Container, Stack, Toolbar, Typography } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import ColorModeSwitch from '../components/app/ColorModeSwitch';
import ProfilesPage from '../pages/ProfilesPage';
import ProfileUpsertPage from '../pages/ProfileUpsertPage';
import SqlParametersPage from '../pages/SqlParametersPage';
import TestCaseResultPage from '../pages/TestCaseResultPage';
import TestCaseUpsertPage from '../pages/TestCaseUpsertPage';
import TestCasesPage from '../pages/TestCasesPage';

type AppProps = {
  colorMode: PaletteMode;
  onToggleColorMode: () => void;
};

function App({ colorMode, onToggleColorMode }: AppProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        transition: 'background-color 220ms ease, color 220ms ease',
      }}
    >
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                component="img"
                src="/sql-compare-icon.svg"
                alt="SQL Compare Tool"
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: 1,
                  boxShadow: '0 8px 18px rgba(0, 0, 0, 0.24)',
                }}
              />
              <Typography variant="h6" component="h1">
                SQL Compare Tool
              </Typography>
            </Stack>
          </Link>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={0.5} alignItems="center">
            <ColorModeSwitch colorMode={colorMode} onToggle={onToggleColorMode} />
          </Stack>
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
