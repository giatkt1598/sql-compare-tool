import { ApiService } from './base/ApiService';
import { API_BASE_URL } from './base/httpClient';
import type {
  RunTestCaseDraftPayload,
  SqlBuildTestCaseQueryResponse,
  SqlLatestTestCaseResultResponse,
  SqlRunManyTestCasesPayload,
  SqlRunManyTestCasesResponse,
  SqlRunTestCaseResponse,
  SqlTestConnectionPayload,
  SqlTestConnectionResponse,
} from './sqlApi.types';

class SqlApi extends ApiService {
  constructor() {
    super('/api/sql');
  }

  getTestCaseEventsUrl(testCaseId: string) {
    return `${API_BASE_URL}/api/sql/test-cases/${testCaseId}/events`;
  }

  getProfileTestCaseEventsUrl(profileId: string) {
    return `${API_BASE_URL}/api/sql/profiles/${profileId}/test-case-events`;
  }

  testConnection(payload: SqlTestConnectionPayload) {
    return this.post<SqlTestConnectionResponse>('/test-connection', payload);
  }

  runTestCase(testCaseId: string, draft?: RunTestCaseDraftPayload) {
    return this.post<SqlRunTestCaseResponse>('/run-test-case', {
      testCaseId,
      draft,
    });
  }

  buildTestCaseQuery(testCaseId: string, draft?: RunTestCaseDraftPayload) {
    return this.post<SqlBuildTestCaseQueryResponse>('/build-test-case-query', {
      testCaseId,
      draft,
    });
  }

  runManyTestCases(payload: SqlRunManyTestCasesPayload) {
    return this.post<SqlRunManyTestCasesResponse>('/run-many-test-cases', payload);
  }

  getLatestTestCaseResult(testCaseId: string) {
    return this.get<SqlLatestTestCaseResultResponse>(`/test-cases/${testCaseId}/latest-result`);
  }
}

export const sqlApi = new SqlApi();
