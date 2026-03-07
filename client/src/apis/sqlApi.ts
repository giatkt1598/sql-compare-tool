import type { ProfileFormInput } from '../models/profile';
import { readApiErrorMessage } from './apiError';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
const API_SQL_URL = `${API_BASE_URL}/api/sql`;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const timeoutMs = 15000;
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      signal: abortController.signal,
      ...init,
    });

    if (!response.ok) {
      throw new Error(await readApiErrorMessage(response, 'API request failed'));
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export const sqlApi = {
  getTestCaseEventsUrl: (testCaseId: string) => `${API_SQL_URL}/test-cases/${testCaseId}/events`,
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
      parallelExecution?: boolean;
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
        parallelExecution?: boolean;
        oldSqlDuration?: number | null;
        newSqlDuration?: number | null;
        compareDuration?: number | null;
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
  buildTestCaseQuery: (
    testCaseId: string,
    draft?: {
      name?: string;
      parameter?: string;
      enabled?: boolean;
      compareInOrder?: boolean;
      parallelExecution?: boolean;
    }
  ) =>
    request<{
      testCaseId: string;
      profileId: string;
      profileName: string;
      sqlProvider: string;
      oldSqlFilePath: string;
      newSqlFilePath: string;
      oldSql: string;
      newSql: string;
    }>(`${API_SQL_URL}/build-test-case-query`, {
      method: 'POST',
      body: JSON.stringify({ testCaseId, draft }),
    }),
  runManyTestCases: (payload: {
    profileId: string;
    scope: 'all' | 'enabled';
    runInParallel: boolean;
    maxConcurrency: number;
  }) =>
    request<{
      success: boolean;
      profileId: string;
      totalSelected: number;
      startedCount: number;
      skippedCount: number;
      startedTestCaseIds: string[];
      skippedTestCaseIds: string[];
      message: string;
    }>(`${API_SQL_URL}/run-many-test-cases`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getLatestTestCaseResult: (testCaseId: string) =>
    request<{
      testCaseId: string;
      profileId: string;
      name: string;
      enabled: boolean;
      compareInOrder: boolean;
      parallelExecution: boolean;
      autoRunWhenSqlChanges: boolean;
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
          parallelExecution?: boolean;
          oldSqlDuration?: number | null;
          newSqlDuration?: number | null;
          compareDuration?: number | null;
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
