import { Alert, CircularProgress, Snackbar, Stack } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { profileApi } from '../apis/profileApi';
import { sqlApi } from '../apis/sqlApi';
import ProfileForm from '../components/profiles/ProfileForm';
import {
  defaultProfileFormInput,
  toProfileFormInput,
  type ProfileFormInput,
} from '../models/profile';

interface ToastState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

function ProfileUpsertPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = useMemo(() => Boolean(id), [id]);
  const [formValue, setFormValue] = useState<ProfileFormInput>(defaultProfileFormInput);
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isConnectionSuccess, setIsConnectionSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (!isEditMode || !id) {
      setFormValue(defaultProfileFormInput);
      setIsLoading(false);
      setErrorMessage(null);
      setIsConnectionSuccess(false);
      setToast({ open: false, message: '', severity: 'success' });
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const profile = await profileApi.getById(id);
        setFormValue(toProfileFormInput(profile));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Load profile failed');
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [id, isEditMode]);

  const handleSubmit = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      if (isEditMode && id) {
        await profileApi.update(id, formValue);
      } else {
        await profileApi.create(formValue);
      }
      navigate('/profiles');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Save profile failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setErrorMessage(null);
    setIsConnectionSuccess(false);
    try {
      const result = await sqlApi.testConnection({
        sqlProvider: formValue.sqlProvider,
        sqlConnection: formValue.sqlConnection,
      });
      setIsConnectionSuccess(true);
      setToast({
        open: true,
        message: result.message || 'Connection successful',
        severity: 'success',
      });
    } catch (error) {
      setIsConnectionSuccess(false);
      setToast({
        open: true,
        message: error instanceof Error ? error.message : 'Test connection failed',
        severity: 'error',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (isLoading) {
    return (
      <Stack alignItems="center" py={10}>
        <CircularProgress />
      </Stack>
    );
  }

  const handleFormChange = (value: ProfileFormInput) => {
    setIsConnectionSuccess(false);
    setFormValue(value);
  };

  return (
    <Stack
      spacing={2}
      sx={{
        minHeight: 'calc(100vh - 160px)',
        alignItems: 'center',
      }}
    >
      <ProfileForm
        mode={isEditMode ? 'edit' : 'create'}
        formValue={formValue}
        loading={isSaving}
        testingConnection={isTestingConnection}
        canTestConnection
        testConnectionSuccess={isConnectionSuccess}
        onChange={handleFormChange}
        onSubmit={handleSubmit}
        onTestConnection={handleTestConnection}
        onCancel={() => navigate('/profiles')}
      />

      <Snackbar
        open={Boolean(errorMessage) || toast.open}
        autoHideDuration={3500}
        onClose={() => {
          setErrorMessage(null);
          setToast((current) => ({ ...current, open: false }));
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={errorMessage ? 'error' : toast.severity}
          onClose={() => {
            setErrorMessage(null);
            setToast((current) => ({ ...current, open: false }));
          }}
          variant="filled"
        >
          {errorMessage ?? toast.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

export default ProfileUpsertPage;
