import {
  Box,
  Button,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  useEffect,
  useRef,
  type ChangeEvent,
  type ReactElement,
  type SyntheticEvent,
} from "react";
import {
  getDefaultConnection,
  type ProfileFormInput,
  type SqlConnection,
  type SqlProvider,
} from "../../models/profile";
import PostgresConnectionFields from "./connection-fields/PostgresConnectionFields";
import SqlServerConnectionFields from "./connection-fields/SqlServerConnectionFields";
import type { ConnectionFieldsProps } from "./connection-fields/types";

interface ProfileFormProps {
  mode: "create" | "edit";
  formValue: ProfileFormInput;
  loading: boolean;
  testingConnection?: boolean;
  canTestConnection?: boolean;
  onChange: (value: ProfileFormInput) => void;
  onSubmit: () => Promise<void>;
  onTestConnection?: () => Promise<void>;
  onCancel: () => void;
}

const sqlProviders: SqlProvider[] = ["SqlServer", "Postgres"];
const connectionFieldsByProvider: Record<
  SqlProvider,
  (props: ConnectionFieldsProps) => ReactElement
> = {
  SqlServer: SqlServerConnectionFields,
  Postgres: PostgresConnectionFields,
};

function ProfileForm(props: ProfileFormProps) {
  const {
    mode,
    formValue,
    loading,
    testingConnection = false,
    canTestConnection = false,
    onChange,
    onSubmit,
    onTestConnection,
    onCancel,
  } = props;
  const providerConnectionCacheRef = useRef<Record<SqlProvider, SqlConnection>>(
    {
      SqlServer: getDefaultConnection("SqlServer"),
      Postgres: getDefaultConnection("Postgres"),
    },
  );
  const oldSqlFileInputRef = useRef<HTMLInputElement | null>(null);
  const newSqlFileInputRef = useRef<HTMLInputElement | null>(null);
  const ConnectionFields = connectionFieldsByProvider[formValue.sqlProvider];

  useEffect(() => {
    providerConnectionCacheRef.current[formValue.sqlProvider] = {
      ...formValue.sqlConnection,
    };
  }, [formValue.sqlProvider, formValue.sqlConnection]);

  const handleProviderTabChange = (
    _event: SyntheticEvent,
    provider: SqlProvider,
  ) => {
    providerConnectionCacheRef.current[formValue.sqlProvider] = {
      ...formValue.sqlConnection,
    };

    const nextConnection =
      providerConnectionCacheRef.current[provider] ??
      getDefaultConnection(provider);

    onChange({
      ...formValue,
      sqlProvider: provider,
      sqlConnection: { ...nextConnection },
    });
  };

  const updateConnection = (connection: Partial<SqlConnection>) => {
    const nextConnection = {
      ...formValue.sqlConnection,
      ...connection,
    };

    providerConnectionCacheRef.current[formValue.sqlProvider] = nextConnection;
    onChange({
      ...formValue,
      sqlConnection: nextConnection,
    });
  };

  const handlePickSqlFile = (
    field: "oldSqlFilePath" | "newSqlFilePath",
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    const browserReportedPath = event.target.value?.trim() ?? "";
    const nextPath = browserReportedPath || selectedFile.name;

    onChange({
      ...formValue,
      [field]: nextPath,
    });
    event.target.value = "";
  };

  return (
    <Paper
      sx={{
        p: 2.5,
        width: { xs: "100%", md: 900 },
        maxWidth: "100%",
        mx: "auto",
      }}
    >
      <Stack spacing={1.5}>
        <Typography variant="h5">
          {mode === "create" ? "Create Profile" : "Edit Profile"}
        </Typography>

        <TextField
          size="small"
          label="Name"
          required
          value={formValue.name}
          onChange={(event) =>
            onChange({ ...formValue, name: event.target.value })
          }
        />
        <TextField
          size="small"
          label="Description"
          multiline
          minRows={2}
          value={formValue.description}
          onChange={(event) =>
            onChange({ ...formValue, description: event.target.value })
          }
        />
        <TextField
          size="small"
          label="SQL Old File"
          required
          value={formValue.oldSqlFilePath}
          onChange={(event) =>
            onChange({ ...formValue, oldSqlFilePath: event.target.value })
          }
          helperText="Paste full absolute path (e.g. D:\\sql-compare-data-test\\query old.sql) if browser returns C:\\fakepath\\..."
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={() => oldSqlFileInputRef.current?.click()}
                    disabled={loading}
                  >
                    Choose .sql
                  </Button>
                </InputAdornment>
              ),
            },
          }}
        />
        <input
          ref={oldSqlFileInputRef}
          type="file"
          accept=".sql"
          style={{ display: "none" }}
          onChange={(event) => handlePickSqlFile("oldSqlFilePath", event)}
        />
        <TextField
          size="small"
          label="SQL New File"
          required
          value={formValue.newSqlFilePath}
          onChange={(event) =>
            onChange({ ...formValue, newSqlFilePath: event.target.value })
          }
          helperText="Paste full absolute path (e.g. D:\\sql-compare-data-test\\query new.sql) if browser returns C:\\fakepath\\..."
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={() => newSqlFileInputRef.current?.click()}
                    disabled={loading}
                  >
                    Choose .sql
                  </Button>
                </InputAdornment>
              ),
            },
          }}
        />
        <input
          ref={newSqlFileInputRef}
          type="file"
          accept=".sql"
          style={{ display: "none" }}
          onChange={(event) => handlePickSqlFile("newSqlFilePath", event)}
        />

        <Box sx={{ pt: 1 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Database Connection
          </Typography>
          <Tabs
            value={formValue.sqlProvider}
            onChange={handleProviderTabChange}
            variant="fullWidth"
            sx={{ mb: 2 }}
          >
            {sqlProviders.map((provider) => (
              <Tab
                key={provider}
                value={provider}
                label={provider === "SqlServer" ? "SQL Server" : "Postgres"}
              />
            ))}
          </Tabs>

          <ConnectionFields
            connection={formValue.sqlConnection}
            onChange={updateConnection}
          />
        </Box>

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Tooltip
            title={
              canTestConnection
                ? "Test database connection"
                : "Save profile first to enable test connection"
            }
          >
            <span>
              <Button
                variant="outlined"
                onClick={() => void onTestConnection?.()}
                disabled={!canTestConnection || testingConnection || loading}
              >
                {testingConnection ? "Testing..." : "Test Connection"}
              </Button>
            </span>
          </Tooltip>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => void onSubmit()}
            variant="contained"
            disabled={loading}
          >
            {mode === "create" ? "Create" : "Save changes"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default ProfileForm;
