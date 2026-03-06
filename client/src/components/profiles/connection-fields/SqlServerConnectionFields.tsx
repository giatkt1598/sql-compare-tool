import {
  Box,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import type { SqlServerAuthType } from "../../../models/profile";
import type { ConnectionFieldsProps } from "./types";

const sqlServerAuthTypes: SqlServerAuthType[] = [
  "WindowsAuth",
  "SqlServerAuth",
];

function SqlServerConnectionFields(props: ConnectionFieldsProps) {
  const { connection, onChange } = props;

  return (
    <Stack spacing={1.5}>
      <TextField
        size="small"
        select
        label="Auth Type"
        value={connection.authType ?? "SqlServerAuth"}
        onChange={(event) =>
          onChange({
            authType: event.target.value as SqlServerAuthType,
          })
        }
      >
        {sqlServerAuthTypes.map((authType) => (
          <MenuItem key={authType} value={authType}>
            {authType === "WindowsAuth" ? "Windows Auth" : "SQL Server Auth"}
          </MenuItem>
        ))}
      </TextField>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "3fr 1fr" },
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
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
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
          type="password"
          value={connection.password}
          onChange={(event) => onChange({ password: event.target.value })}
        />

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
              onChange={(event) =>
                onChange({ trustServerCertificate: event.target.checked })
              }
            />
          }
          label="Trust Server Certificate"
        />
      </Box>
    </Stack>
  );
}

export default SqlServerConnectionFields;
