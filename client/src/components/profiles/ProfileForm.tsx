import {
  Box,
  Button,
  Chip,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRef, useState, type ChangeEvent, type SyntheticEvent } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import DbProviderIcon from '../common/DbProviderIcon';
import { type ProfileFormInput, type SqlConnection, type SqlProvider } from '../../models/profile';
import {
  connectionFieldConfigByProvider,
  connectionFieldConfigs,
  getDefaultConnection,
} from './connection-fields/providerRegistry';
import ProfileSqlInputDialog from './ProfileSqlInputDialog';

interface ProfileFormProps {
  mode: 'create' | 'edit';
  formValue: ProfileFormInput;
  loading: boolean;
  testingConnection?: boolean;
  canTestConnection?: boolean;
  testConnectionSuccess?: boolean;
  onChange: (value: ProfileFormInput) => void;
  onSubmit: () => Promise<void>;
  onTestConnection?: () => Promise<void>;
  onCancel: () => void;
}

function ProfileForm(props: ProfileFormProps) {
  const {
    mode,
    formValue,
    loading,
    testingConnection = false,
    canTestConnection = false,
    testConnectionSuccess = false,
    onChange,
    onSubmit,
    onTestConnection,
    onCancel,
  } = props;
  const oldSqlFileInputRef = useRef<HTMLInputElement | null>(null);
  const newSqlFileInputRef = useRef<HTMLInputElement | null>(null);
  const [sqlDialogTarget, setSqlDialogTarget] = useState<'old' | 'new' | null>(null);
  const providerConfig = connectionFieldConfigByProvider[formValue.sqlProvider];
  const ConnectionFields = providerConfig.component;

  const handleProviderTabChange = (_event: SyntheticEvent, provider: SqlProvider) => {
    const cachedConnection = formValue.providerConnections[provider];
    const nextConnection =
      cachedConnection && Object.keys(cachedConnection).length > 0
        ? cachedConnection
        : getDefaultConnection(provider);

    onChange({
      ...formValue,
      sqlProvider: provider,
      sqlConnection: { ...nextConnection },
      providerConnections: {
        ...formValue.providerConnections,
        [provider]: { ...nextConnection },
      },
    });
  };

  const updateConnection = (connection: Partial<SqlConnection>) => {
    const nextConnection = {
      ...formValue.sqlConnection,
      ...connection,
    };

    onChange({
      ...formValue,
      sqlConnection: nextConnection,
      providerConnections: {
        ...formValue.providerConnections,
        [formValue.sqlProvider]: nextConnection,
      },
    });
  };

  const handleResetConnection = () => {
    const nextConnection = getDefaultConnection(formValue.sqlProvider);
    onChange({
      ...formValue,
      sqlConnection: nextConnection,
      providerConnections: {
        ...formValue.providerConnections,
        [formValue.sqlProvider]: nextConnection,
      },
    });
  };

  const handlePickSqlFile = (
    field: 'oldSqlFilePath' | 'newSqlFilePath',
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    const browserReportedPath = event.target.value?.trim() ?? '';
    const nextPath = browserReportedPath || selectedFile.name;

    onChange({
      ...formValue,
      [field]: nextPath,
    });
    event.target.value = '';
  };

  const hasInlineOldSql = Boolean(formValue.oldSqlContent?.trim());
  const hasInlineNewSql = Boolean(formValue.newSqlContent?.trim());

  return (
    <Paper
      sx={{
        p: 2.5,
        width: { xs: '100%', md: 900 },
        maxWidth: '100%',
        mx: 'auto',
      }}
    >
      <Stack component="form" autoComplete="off" noValidate spacing={1.5}>
        <Typography variant="h5">
          {mode === 'create' ? 'Create Profile' : 'Edit Profile'}
        </Typography>

        <TextField
          size="small"
          label="Name"
          required
          value={formValue.name}
          onChange={(event) => onChange({ ...formValue, name: event.target.value })}
        />
        <TextField
          size="small"
          label="Description"
          multiline
          minRows={2}
          value={formValue.description}
          onChange={(event) => onChange({ ...formValue, description: event.target.value })}
        />
        <TextField
          size="small"
          label="SQL Old File"
          value={formValue.oldSqlFilePath}
          onChange={(event) => onChange({ ...formValue, oldSqlFilePath: event.target.value })}
          helperText={
            hasInlineOldSql
              ? 'Inline SQL content is available and will be used by the server first.'
              : 'Paste full absolute path (e.g. D:\\sql-compare-data-test\\query old.sql) if browser returns C:\\fakepath\\...'
          }
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  {hasInlineOldSql ? (
                    <Chip label="Inline SQL" size="small" color="primary" sx={{ mr: 1 }} />
                  ) : null}
                  <Button
                    size="small"
                    onClick={() => setSqlDialogTarget('old')}
                    disabled={loading}
                  >
                    Input SQL
                  </Button>
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
          style={{ display: 'none' }}
          onChange={(event) => handlePickSqlFile('oldSqlFilePath', event)}
        />
        <TextField
          size="small"
          label="SQL New File"
          value={formValue.newSqlFilePath}
          onChange={(event) => onChange({ ...formValue, newSqlFilePath: event.target.value })}
          helperText={
            hasInlineNewSql
              ? 'Inline SQL content is available and will be used by the server first.'
              : 'Paste full absolute path (e.g. D:\\sql-compare-data-test\\query new.sql) if browser returns C:\\fakepath\\...'
          }
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  {hasInlineNewSql ? (
                    <Chip label="Inline SQL" size="small" color="primary" sx={{ mr: 1 }} />
                  ) : null}
                  <Button
                    size="small"
                    onClick={() => setSqlDialogTarget('new')}
                    disabled={loading}
                  >
                    Input SQL
                  </Button>
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
          style={{ display: 'none' }}
          onChange={(event) => handlePickSqlFile('newSqlFilePath', event)}
        />

        <Box sx={{ pt: 1 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Database Connection
          </Typography>
          <Tabs
            value={formValue.sqlProvider}
            onChange={handleProviderTabChange}
            variant="standard"
            sx={{ mb: 2 }}
          >
            {connectionFieldConfigs.map((providerConfig) => (
              <Tab
                key={providerConfig.provider}
                value={providerConfig.provider}
                icon={<DbProviderIcon provider={providerConfig.provider} fontSize="small" />}
                iconPosition="start"
                label={providerConfig.label}
              />
            ))}
          </Tabs>

          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.5 }}>
            <Button size="small" onClick={handleResetConnection} disabled={loading}>
              Reset to default
            </Button>
          </Stack>

          <ConnectionFields connection={formValue.sqlConnection} onChange={updateConnection} />
        </Box>

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Tooltip
            title={
              canTestConnection
                ? 'Test database connection'
                : 'Save profile first to enable test connection'
            }
          >
            <span>
              <Button
                variant="outlined"
                onClick={() => void onTestConnection?.()}
                disabled={!canTestConnection || testingConnection || loading}
              >
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
            </span>
          </Tooltip>
          {testConnectionSuccess ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckIcon color="success" />
              <span style={{ color: 'green' }}>Connection success!</span>
            </Box>
          ) : null}
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => void onSubmit()} variant="contained" disabled={loading}>
            {mode === 'create' ? 'Create' : 'Save changes'}
          </Button>
        </Stack>
      </Stack>
      <ProfileSqlInputDialog
        open={sqlDialogTarget === 'old'}
        title="Input SQL Old Content"
        value={formValue.oldSqlContent ?? ''}
        onClose={() => setSqlDialogTarget(null)}
        onChange={(value) => onChange({ ...formValue, oldSqlContent: value })}
      />
      <ProfileSqlInputDialog
        open={sqlDialogTarget === 'new'}
        title="Input SQL New Content"
        value={formValue.newSqlContent ?? ''}
        onClose={() => setSqlDialogTarget(null)}
        onChange={(value) => onChange({ ...formValue, newSqlContent: value })}
      />
    </Paper>
  );
}

export default ProfileForm;
