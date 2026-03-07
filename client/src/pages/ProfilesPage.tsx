import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { Alert, Button, CircularProgress, Snackbar, Stack, Typography } from '@mui/material';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../apis/profileApi';
import ProfilesTable from '../components/profiles/ProfilesTable';
import { useProfiles } from '../hooks/useProfiles';
import type { Profile } from '../models/profile';

interface ToastState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

function ProfilesPage() {
  const navigate = useNavigate();
  const { profiles, isLoading, error, fetchProfiles, deleteProfile } = useProfiles();
  const restoreInputRef = useRef<HTMLInputElement | null>(null);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const showToast = (message: string, severity: ToastState['severity']) => {
    setToast({ open: true, message, severity });
  };

  const handleDeleteProfile = async (profile: Profile) => {
    if (!window.confirm(`Delete profile "${profile.name}"?`)) {
      return;
    }

    try {
      await deleteProfile(profile.id);
      showToast('Profile deleted successfully', 'success');
    } catch (deleteError) {
      showToast(
        deleteError instanceof Error ? deleteError.message : 'Delete profile failed',
        'error'
      );
    }
  };

  const handleBackupProfile = async (profile: Profile) => {
    try {
      const { blob, fileName } = await profileApi.backup(profile.id);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      showToast('Profile backup downloaded successfully', 'success');
    } catch (backupError) {
      showToast(
        backupError instanceof Error ? backupError.message : 'Backup profile failed',
        'error'
      );
    }
  };

  const handleRestoreProfile = async (file: File) => {
    try {
      const result = await profileApi.restore(file);
      await fetchProfiles();
      showToast(result.message, 'success');
    } catch (restoreError) {
      showToast(
        restoreError instanceof Error ? restoreError.message : 'Restore profile failed',
        'error'
      );
    }
  };

  return (
    <Stack spacing={3}>
      <input
        ref={restoreInputRef}
        type="file"
        accept=".zip,application/zip"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleRestoreProfile(file);
          }
          event.target.value = '';
        }}
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
      >
        <Typography variant="h4">Profile Management</Typography>
        <Stack direction="row" spacing={1.5}>
          <Button
            startIcon={<RefreshOutlinedIcon />}
            onClick={() => void fetchProfiles()}
            variant="outlined"
          >
            Refresh
          </Button>
          <Button
            startIcon={<RestoreOutlinedIcon />}
            variant="outlined"
            onClick={() => restoreInputRef.current?.click()}
          >
            Restore Backup
          </Button>
          <Button
            startIcon={<AddCircleOutlineOutlinedIcon />}
            variant="contained"
            onClick={() => navigate('/profiles/new')}
          >
            New Profile
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {isLoading ? (
        <Stack alignItems="center" py={10}>
          <CircularProgress />
        </Stack>
      ) : (
        <ProfilesTable
          profiles={profiles}
          onOpenTestCases={(profile) => navigate(`/profiles/${profile.id}/test-cases`)}
          onEdit={(profile) => navigate(`/profiles/${profile.id}`)}
          onDelete={handleDeleteProfile}
          onBackup={handleBackupProfile}
        />
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((current) => ({ ...current, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

export default ProfilesPage;
