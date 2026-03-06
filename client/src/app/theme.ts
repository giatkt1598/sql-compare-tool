import { createTheme } from '@mui/material'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0b5fff',
    },
    secondary: {
      main: '#0f766e',
    },
    background: {
      default: '#f4f7fb',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 10,
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
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
})
