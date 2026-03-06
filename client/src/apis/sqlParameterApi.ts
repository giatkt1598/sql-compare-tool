import type {
  SqlParameter,
  SqlParameterArrayItemInput,
  SqlParameterFormInput,
} from '../models/sqlParameter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const API_SQL_PARAMETER_URL = `${API_BASE_URL}/api/sql-parameters`;

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

export const sqlParameterApi = {
  getByProfileId: (profileId: string) =>
    request<SqlParameter[]>(`${API_SQL_PARAMETER_URL}/profile/${profileId}`),
  getById: (id: string) => request<SqlParameter>(`${API_SQL_PARAMETER_URL}/${id}`),
  create: (profileId: string, payload: SqlParameterFormInput) =>
    request<SqlParameter>(API_SQL_PARAMETER_URL, {
      method: 'POST',
      body: JSON.stringify({
        profileId,
        ...payload,
      }),
    }),
  update: (id: string, payload: Partial<SqlParameterFormInput>) =>
    request<SqlParameter>(`${API_SQL_PARAMETER_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    request<{ message: string; id: string }>(`${API_SQL_PARAMETER_URL}/${id}`, {
      method: 'DELETE',
    }),
  replaceByProfileId: (profileId: string, items: SqlParameterArrayItemInput[]) =>
    request<SqlParameter[]>(`${API_SQL_PARAMETER_URL}/profile/${profileId}`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    }),
};
