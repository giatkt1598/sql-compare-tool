import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { Alert, Button, CircularProgress, Snackbar, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  return (
    <Stack spacing={3}>
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
          onEdit={(profile) => navigate(`/profiles/${profile.id}`)}
          onParameters={(profile) => navigate(`/profiles/${profile.id}/parameters`)}
          onDelete={handleDeleteProfile}
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
