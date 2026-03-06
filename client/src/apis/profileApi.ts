import type { Profile, ProfileFormInput } from '../models/profile';

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
    const errorText = await response.text();
    throw new Error(errorText || 'API request failed');
  }

  return (await response.json()) as T;
}

export const profileApi = {
  getAll: () => request<Profile[]>(API_PROFILE_URL),
  getById: (id: string) => request<Profile>(`${API_PROFILE_URL}/${id}`),
  create: (payload: ProfileFormInput) =>
    request<Profile>(API_PROFILE_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: Partial<ProfileFormInput>) =>
    request<Profile>(`${API_PROFILE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    request<{ message: string; id: string }>(`${API_PROFILE_URL}/${id}`, {
      method: 'DELETE',
    }),
};
