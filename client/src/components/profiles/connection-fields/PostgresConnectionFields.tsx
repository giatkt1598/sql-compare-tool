import { Box, IconButton, InputAdornment, MenuItem, Stack, TextField } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useState } from 'react';
import type { PostgresSslMode } from '../../../models/profile';
import type { ConnectionFieldsProps } from './types';

const postgresSslModes: PostgresSslMode[] = [
  'disable',
  'allow',
  'prefer',
  'require',
  'verify-ca',
  'verify-full',
];

function PostgresConnectionFields(props: ConnectionFieldsProps) {
  const { connection, onChange } = props;
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Stack spacing={1.5} width="100%">
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

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '3fr 1fr' },
        }}
      >
        <TextField
          size="small"
          label="Database"
          required
          value={connection.database}
          onChange={(event) => onChange({ database: event.target.value })}
        />

        <TextField
          size="small"
          select
          label="SSL Mode"
          value={connection.sslMode ?? 'prefer'}
          onChange={(event) => onChange({ sslMode: event.target.value as PostgresSslMode })}
        >
          {postgresSslModes.map((sslMode) => (
            <MenuItem key={sslMode} value={sslMode}>
              {sslMode}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        }}
      >
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
      </Box>
    </Stack>
  );
}

export default PostgresConnectionFields;
