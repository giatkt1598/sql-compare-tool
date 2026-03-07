import type { TestCase } from '../models/testCase';
import { readApiErrorMessage } from './apiError';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const API_TEST_CASE_URL = `${API_BASE_URL}/api/test-cases`;

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

export const testCaseApi = {
  getByProfileId: (profileId: string) =>
    request<TestCase[]>(`${API_TEST_CASE_URL}/profile/${profileId}`),
  getById: (id: string) => request<TestCase>(`${API_TEST_CASE_URL}/${id}`),
  create: (payload: Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<TestCase>(API_TEST_CASE_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (
    id: string,
    payload: Partial<Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>>
  ) =>
    request<TestCase>(`${API_TEST_CASE_URL}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    request<{ message: string; id: string }>(`${API_TEST_CASE_URL}/${id}`, {
      method: 'DELETE',
    }),
};
