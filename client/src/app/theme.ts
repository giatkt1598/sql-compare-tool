import { createTheme, type PaletteMode } from '@mui/material';

export function getAppTheme(mode: PaletteMode) {
  const isDark = mode === 'dark';
  const transition = 'background-color 220ms ease, border-color 220ms ease, color 220ms ease, box-shadow 220ms ease';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#ff6b2c' : '#0b5fff',
      },
      secondary: {
        main: isDark ? '#12b886' : '#0f766e',
      },
      background: {
        default: isDark ? '#080b11' : '#f4f7fb',
        paper: isDark ? '#10151d' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f3f7ff' : '#112033',
        secondary: isDark ? '#97a3b6' : '#53657d',
      },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h6: {
        fontWeight: 600,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          'html, body, #root': {
            transition,
          },
          body: {
            background: isDark
              ? 'radial-gradient(circle at top, rgba(255, 106, 44, 0.22), transparent 26%), radial-gradient(circle at right, rgba(18, 184, 134, 0.14), transparent 22%), linear-gradient(180deg, #090c12 0%, #05070b 100%)'
              : 'radial-gradient(circle at top, rgba(11, 95, 255, 0.14), transparent 28%), radial-gradient(circle at right, rgba(15, 118, 110, 0.12), transparent 24%), linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)',
            color: isDark ? '#f3f7ff' : '#112033',
            transition: 'background 260ms ease, color 220ms ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.06)'
              : '1px solid rgba(17, 32, 51, 0.08)',
            transition,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderBottom: isDark
              ? '1px solid rgba(255, 255, 255, 0.06)'
              : '1px solid rgba(17, 32, 51, 0.08)',
            transition,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: isDark
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(17, 32, 51, 0.08)',
            transition,
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            transition,
          },
        },
      },
    },
  });
}
