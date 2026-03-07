import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, type PaletteMode } from '@mui/material';
import App from './App';
import { getAppTheme } from './theme';

const COLOR_MODE_STORAGE_KEY = 'sql-comparer-color-mode';
const THEME_TRANSITION_DURATION_MS = 280;

function AppRoot() {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    return savedMode === 'light' ? 'light' : 'dark';
  });
  const [transitionOverlayMode, setTransitionOverlayMode] = useState<PaletteMode | null>(null);

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  useEffect(() => {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (!transitionOverlayMode) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setTransitionOverlayMode(null);
    }, THEME_TRANSITION_DURATION_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [transitionOverlayMode]);

  const handleToggleColorMode = () => {
    const nextMode: PaletteMode = mode === 'dark' ? 'light' : 'dark';
    setTransitionOverlayMode(nextMode);
    requestAnimationFrame(() => {
      setMode(nextMode);
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {transitionOverlayMode ? (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            pointerEvents: 'none',
            opacity: 1,
            background:
              transitionOverlayMode === 'dark'
                ? 'radial-gradient(circle at top, rgba(255, 106, 44, 0.10), transparent 24%), rgba(4, 6, 10, 0.22)'
                : 'radial-gradient(circle at top, rgba(255, 255, 255, 0.18), transparent 24%), rgba(244, 247, 251, 0.26)',
            backdropFilter: 'blur(6px)',
            animation: `themeOverlayFade ${THEME_TRANSITION_DURATION_MS}ms ease forwards`,
            '@keyframes themeOverlayFade': {
              '0%': {
                opacity: 0,
              },
              '25%': {
                opacity: 1,
              },
              '100%': {
                opacity: 0,
              },
            },
          }}
        />
      ) : null}
      <BrowserRouter>
        <App colorMode={mode} onToggleColorMode={handleToggleColorMode} />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default AppRoot;
