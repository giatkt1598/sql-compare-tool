import { Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import type { ProfileFormInput, SqlProvider } from '../../models/profile'

interface ProfileFormProps {
  mode: 'create' | 'edit'
  formValue: ProfileFormInput
  loading: boolean
  onChange: (value: ProfileFormInput) => void
  onSubmit: () => Promise<void>
  onCancel: () => void
}

const sqlProviders: SqlProvider[] = ['SqlServer', 'Postgres']

function ProfileForm(props: ProfileFormProps) {
  const { mode, formValue, loading, onChange, onSubmit, onCancel } = props

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5">{mode === 'create' ? 'Create Profile' : 'Edit Profile'}</Typography>

        <TextField
          label="Name"
          required
          value={formValue.name}
          onChange={(event) => onChange({ ...formValue, name: event.target.value })}
        />
        <TextField
          label="Description"
          multiline
          minRows={2}
          value={formValue.description}
          onChange={(event) => onChange({ ...formValue, description: event.target.value })}
        />
        <TextField
          select
          label="SQL Provider"
          value={formValue.sqlProvider}
          onChange={(event) =>
            onChange({
              ...formValue,
              sqlProvider: event.target.value as SqlProvider,
            })
          }
        >
          {sqlProviders.map((provider) => (
            <MenuItem key={provider} value={provider}>
              {provider}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Old SQL file path"
          required
          value={formValue.oldSqlFilePath}
          onChange={(event) => onChange({ ...formValue, oldSqlFilePath: event.target.value })}
        />
        <TextField
          label="New SQL file path"
          required
          value={formValue.newSqlFilePath}
          onChange={(event) => onChange({ ...formValue, newSqlFilePath: event.target.value })}
        />

        <Box sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <TextField
              label="DB Host"
              required
              value={formValue.sqlConnection.host}
              onChange={(event) =>
                onChange({
                  ...formValue,
                  sqlConnection: { ...formValue.sqlConnection, host: event.target.value },
                })
              }
            />
            <TextField
              label="DB Port"
              required
              value={formValue.sqlConnection.port}
              onChange={(event) =>
                onChange({
                  ...formValue,
                  sqlConnection: { ...formValue.sqlConnection, port: event.target.value },
                })
              }
            />
            <TextField
              label="DB Name"
              required
              value={formValue.sqlConnection.database}
              onChange={(event) =>
                onChange({
                  ...formValue,
                  sqlConnection: { ...formValue.sqlConnection, database: event.target.value },
                })
              }
            />
            <TextField
              label="DB Username"
              required
              value={formValue.sqlConnection.username}
              onChange={(event) =>
                onChange({
                  ...formValue,
                  sqlConnection: { ...formValue.sqlConnection, username: event.target.value },
                })
              }
            />
            <TextField
              label="DB Password"
              required
              type="password"
              value={formValue.sqlConnection.password}
              onChange={(event) =>
                onChange({
                  ...formValue,
                  sqlConnection: { ...formValue.sqlConnection, password: event.target.value },
                })
              }
            />
          </Stack>
        </Box>

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => void onSubmit()} variant="contained" disabled={loading}>
            {mode === 'create' ? 'Create' : 'Save changes'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

export default ProfileForm
