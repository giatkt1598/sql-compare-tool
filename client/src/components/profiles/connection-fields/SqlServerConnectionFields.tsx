import {
  Box,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useState } from 'react';
import type { SqlServerAuthType } from '../../../models/profile';
import type { ConnectionFieldsProps } from './types';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';

const sqlServerAuthTypes: SqlServerAuthType[] = ['WindowsAuth', 'SqlServerAuth'];

function SwitchWithHelp(props: {
  checked: boolean;
  label: string;
  helpText: string;
  onChange: (checked: boolean) => void;
}) {
  const { checked, label, helpText, onChange } = props;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <FormControlLabel
        control={<Switch checked={checked} onChange={(event) => onChange(event.target.checked)} />}
        label={label}
        sx={{ mr: 0 }}
      />
      <Tooltip title={helpText} placement="top" arrow>
        <HelpOutlineOutlinedIcon fontSize="small" color="action" sx={{ cursor: 'help' }} />
      </Tooltip>
    </Box>
  );
}

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

        <SwitchWithHelp
          checked={Boolean(connection.encrypt)}
          label="Encrypt"
          helpText="Encrypts the connection between app and SQL Server. Keep this on in most cases. For local dev, turning it off can help if the server does not support TLS correctly."
          onChange={(checked) => onChange({ encrypt: checked })}
        />

        <SwitchWithHelp
          checked={Boolean(connection.trustServerCertificate)}
          label="Trust Server Certificate"
          helpText="Accepts the SQL Server certificate without validating the certificate chain. Useful for local or self-signed environments, but weaker for production security."
          onChange={(checked) => onChange({ trustServerCertificate: checked })}
        />

        <SwitchWithHelp
          checked={Boolean(connection.multipleActiveResultSets)}
          label="Multiple Active Result Sets"
          helpText="Allows multiple active commands on the same SQL Server connection. Usually keep this on unless you have a reason to reduce connection features."
          onChange={(checked) => onChange({ multipleActiveResultSets: checked })}
        />
      </Box>
    </Stack>
  );
}

export default SqlServerConnectionFields;
