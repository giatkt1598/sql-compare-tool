import type { ProfileFormInput } from '../models/profile';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const API_SQL_URL = `${API_BASE_URL}/api/sql`;

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

export const sqlApi = {
  testConnection: (payload: Pick<ProfileFormInput, 'sqlProvider' | 'sqlConnection'>) =>
    request<{ success: boolean; message: string; timestamp: string }>(
      `${API_SQL_URL}/test-connection`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),
  runTestCase: (
    testCaseId: string,
    draft?: {
      name?: string;
      parameter?: string;
      enabled?: boolean;
      compareInOrder?: boolean;
    }
  ) =>
    request<{
      success: boolean;
      message: string;
      testCaseId: string;
      profileId: string;
      executionCount: number;
      status: 'success' | 'failed' | 'running' | 'error';
      error: string | null;
      executionDuration: number;
      executionTime: string;
      files: {
        oldResultPath: string;
        newResultPath: string;
        diffResultPath: string;
      };
      diffSummary: {
        executionTime: string;
        error?: string;
        oldCount?: number;
        newCount?: number;
        differenceCount?: number;
        onlyInOldCount?: number;
        onlyInNewCount?: number;
        changedCount?: number;
        matched?: boolean;
      };
    }>(`${API_SQL_URL}/run-test-case`, {
      method: 'POST',
      body: JSON.stringify({ testCaseId, draft }),
    }),
  getLatestTestCaseResult: (testCaseId: string) =>
    request<{
      testCaseId: string;
      profileId: string;
      executionCount: number;
      executionTime: string | null;
      executionDuration: number | null;
      status: 'success' | 'failed' | 'running' | 'error' | null;
      error: string | null;
      oldRows: Array<Record<string, unknown>>;
      newRows: Array<Record<string, unknown>>;
      diffPayload: {
        summary: {
          executionTime: string;
          error?: string;
          oldCount?: number;
          newCount?: number;
          differenceCount?: number;
          onlyInOldCount?: number;
          onlyInNewCount?: number;
          changedCount?: number;
          matched?: boolean;
        };
        differences: Array<{
          index: number;
          type: 'changed' | 'onlyInOld' | 'onlyInNew';
          oldRecord: Record<string, unknown> | null;
          newRecord: Record<string, unknown> | null;
        }>;
      };
      files: {
        runDir: string;
        oldResultPath: string;
        newResultPath: string;
        diffResultPath: string;
      };
    }>(`${API_SQL_URL}/test-cases/${testCaseId}/latest-result`),
};
