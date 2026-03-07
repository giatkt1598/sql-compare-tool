import type { TestCase } from '../models/testCase';
import { ApiService } from './base/ApiService';

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

  create(payload: Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.post<TestCase>('', payload);
  }

  update(
    id: string,
    payload: Partial<Omit<TestCase, 'id' | 'createdAt' | 'updatedAt'>>
  ) {
    return this.patch<TestCase>(id, payload);
  }

  remove(id: string) {
    return this.delete<{ message: string; id: string }>(id);
  }
}

export const testCaseApi = new TestCaseApi();
