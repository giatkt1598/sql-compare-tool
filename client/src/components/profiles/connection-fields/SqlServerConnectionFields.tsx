import {
  Box,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useState } from 'react';
import type { SqlServerAuthType } from '../../../models/profile';
import type { ConnectionFieldsProps } from './types';

const sqlServerAuthTypes: SqlServerAuthType[] = ['WindowsAuth', 'SqlServerAuth'];

function SqlServerConnectionFields({ connection, onChange }: ConnectionFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isWindowsAuth = connection.authType === 'WindowsAuth';

  return (
    <Stack spacing={1.5}>
      <TextField
        size="small"
        select
        label="Auth Type"
        value={connection.authType ?? 'SqlServerAuth'}
        onChange={(event) =>
          onChange({
            authType: event.target.value as SqlServerAuthType,
          })
        }
      >
        {sqlServerAuthTypes.map((authType) => (
          <MenuItem key={authType} value={authType}>
            {authType === 'WindowsAuth' ? 'Windows Auth' : 'SQL Server Auth'}
          </MenuItem>
        ))}
      </TextField>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '3fr 1fr' },
        }}
      >
        <TextField
          size="small"
          label="Host"
          required
          value={connection.host}
          onChange={(event) => onChange({ host: event.target.value })}
        />
        <TextField
          size="small"
          label="Port"
          required
          value={connection.port}
          onChange={(event) => onChange({ port: event.target.value })}
        />
      </Box>

      <TextField
        size="small"
        label="Database"
        required
        value={connection.database}
        onChange={(event) => onChange({ database: event.target.value })}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        }}
      >
        {!isWindowsAuth ? (
          <>
            <TextField
              size="small"
              label="Username"
              required
              value={connection.username}
              onChange={(event) => onChange({ username: event.target.value })}
            />
            <TextField
              size="small"
              label="Password"
              required
              type={showPassword ? 'text' : 'password'}
              value={connection.password}
              onChange={(event) => onChange({ password: event.target.value })}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => setShowPassword((current) => !current)}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        {showPassword ? (
                          <VisibilityOffOutlinedIcon fontSize="small" />
                        ) : (
                          <VisibilityOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </>
        ) : null}

        <FormControlLabel
          control={
            <Switch
              checked={Boolean(connection.encrypt)}
              onChange={(event) => onChange({ encrypt: event.target.checked })}
            />
          }
          label="Encrypt"
        />

        <FormControlLabel
          control={
            <Switch
              checked={Boolean(connection.trustServerCertificate)}
              onChange={(event) => onChange({ trustServerCertificate: event.target.checked })}
            />
          }
          label="Trust Server Certificate"
        />
      </Box>
    </Stack>
  );
}

export default SqlServerConnectionFields;
