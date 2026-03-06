import { useCallback, useEffect, useState } from 'react';
import { profileApi } from '../apis/profileApi';
import type { Profile, ProfileFormInput } from '../models/profile';

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await profileApi.getAll();
      setProfiles(data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProfile = useCallback(async (payload: ProfileFormInput) => {
    setIsSaving(true);
    try {
      const newProfile = await profileApi.create(payload);
      setProfiles((current) => [newProfile, ...current]);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateProfile = useCallback(async (id: string, payload: Partial<ProfileFormInput>) => {
    setIsSaving(true);
    try {
      const updated = await profileApi.update(id, payload);
      setProfiles((current) => current.map((item) => (item.id === id ? updated : item)));
    } finally {
      setIsSaving(false);
    }
  }, []);

  const deleteProfile = useCallback(async (id: string) => {
    setIsSaving(true);
    try {
      await profileApi.remove(id);
      setProfiles((current) => current.filter((item) => item.id !== id));
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    isLoading,
    isSaving,
    error,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
  };
}
