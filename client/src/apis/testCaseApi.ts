import type { TestCase } from '../models/testCase';
import { ApiService } from './base/ApiService';

type TestCaseMutationPayload = Omit<
  TestCase,
  'id' | 'createdAt' | 'updatedAt' | 'latestResultSummary'
>;

class TestCaseApi extends ApiService {
  constructor() {
    super('/api/test-cases');
  }

  getByProfileId(profileId: string) {
    return this.get<TestCase[]>(`/profile/${profileId}`);
  }

  getById(id: string) {
    return this.get<TestCase>(id);
  }

  create(payload: TestCaseMutationPayload) {
    return this.post<TestCase>('', payload);
  }

  update(id: string, payload: Partial<TestCaseMutationPayload>) {
    return this.patch<TestCase>(id, payload);
  }

  remove(id: string) {
    return this.delete<{ message: string; id: string }>(id);
  }

  previewImport(profileId: string, names: string[]) {
    return this.post<{ existingNames: string[] }>(`/import/preview`, {
      profileId,
      names,
    });
  }

  importFromExcel(
    profileId: string,
    rows: Array<{
      name: string;
      compareInOrder: boolean;
      parallelExecution: boolean;
      enabled: boolean;
      expectedExecutionDuration: number | null;
      parameter: Record<string, unknown>;
    }>
  ) {
    return this.post<{ created: number; updated: number }>(`/import`, {
      profileId,
      rows,
    });
  }
}

export const testCaseApi = new TestCaseApi();
