import { Box, MenuItem, Stack, TextField } from "@mui/material";
import type { PostgresSslMode } from "../../../models/profile";
import type { ConnectionFieldsProps } from "./types";

const postgresSslModes: PostgresSslMode[] = [
  "disable",
  "allow",
  "prefer",
  "require",
  "verify-ca",
  "verify-full",
];

function PostgresConnectionFields(props: ConnectionFieldsProps) {
  const { connection, onChange } = props;

  return (
    <Stack spacing={1.5} width="100%">
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
          gridTemplateColumns: { xs: "1fr", md: "3fr 1fr" },
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
          value={connection.sslMode ?? "prefer"}
          onChange={(event) =>
            onChange({ sslMode: event.target.value as PostgresSslMode })
          }
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
      </Box>
    </Stack>
  );
}

export default PostgresConnectionFields;
