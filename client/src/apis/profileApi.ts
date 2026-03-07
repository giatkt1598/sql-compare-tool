import type { Profile } from '../models/profile';
import { readApiErrorMessage } from './apiError';

export type ProfilePayload = Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const API_PROFILE_URL = `${API_BASE_URL}/api/profiles`;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response, 'API request failed'));
  }

  return (await response.json()) as T;
}

export const profileApi = {
  getAll: () => request<Profile[]>(API_PROFILE_URL),
  getById: (id: string) => request<Profile>(`${API_PROFILE_URL}/${id}`),
  create: (payload: ProfilePayload) =>
    request<Profile>(API_PROFILE_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: Partial<ProfilePayload>) =>
    request<Profile>(`${API_PROFILE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    request<{ message: string; id: string }>(`${API_PROFILE_URL}/${id}`, {
      method: 'DELETE',
    }),
  backup: async (id: string) => {
    const response = await fetch(`${API_PROFILE_URL}/${id}/backup`);
    if (!response.ok) {
      throw new Error(await readApiErrorMessage(response, 'Backup profile failed'));
    }

    const explicitFileName = response.headers.get('X-Backup-File-Name');
    const contentDisposition = response.headers.get('Content-Disposition');
    const matchedFileName = contentDisposition?.match(/filename="?([^"]+)"?/)?.[1];

    return {
      blob: await response.blob(),
      fileName: explicitFileName ?? matchedFileName ?? `profile-${id}.zip`,
    };
  },
  restore: async (file: File) => {
    const response = await fetch(`${API_PROFILE_URL}/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/zip',
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(await readApiErrorMessage(response, 'Restore profile failed'));
    }

    return (await response.json()) as {
      message: string;
      profileId: string;
      restoredProfileName: string;
      replacedExisting: boolean;
    };
  },
};
