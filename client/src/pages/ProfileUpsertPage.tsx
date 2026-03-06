import { Alert, CircularProgress, Snackbar, Stack } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { profileApi } from '../apis/profileApi'
import ProfileForm from '../components/profiles/ProfileForm'
import {
  defaultProfileFormInput,
  toProfileFormInput,
  type ProfileFormInput,
} from '../models/profile'

function ProfileUpsertPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEditMode = useMemo(() => Boolean(id), [id])
  const [formValue, setFormValue] = useState<ProfileFormInput>(defaultProfileFormInput)
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isEditMode || !id) {
      setFormValue(defaultProfileFormInput)
      setIsLoading(false)
      setErrorMessage(null)
      return
    }

    const loadProfile = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const profile = await profileApi.getById(id)
        setFormValue(toProfileFormInput(profile))
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Load profile failed')
      } finally {
        setIsLoading(false)
      }
    }

    void loadProfile()
  }, [id, isEditMode])

  const handleSubmit = async () => {
    setIsSaving(true)
    setErrorMessage(null)
    try {
      if (isEditMode && id) {
        await profileApi.update(id, formValue)
      } else {
        await profileApi.create(formValue)
      }
      navigate('/profiles')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Save profile failed')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Stack alignItems="center" py={10}>
        <CircularProgress />
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      <ProfileForm
        mode={isEditMode ? 'edit' : 'create'}
        formValue={formValue}
        loading={isSaving}
        onChange={setFormValue}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/profiles')}
      />

      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={3500}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)} variant="filled">
          {errorMessage}
        </Alert>
      </Snackbar>
    </Stack>
  )
}

export default ProfileUpsertPage
