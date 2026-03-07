export const TEST_CASE_STATUSES = ['success', 'failed', 'running', 'error'] as const;

export type TestCaseStatus = (typeof TEST_CASE_STATUSES)[number];
export type NullableTestCaseStatus = TestCaseStatus | null;

export interface TestCaseData {
  id: string;
  profileId: string;
  orderIndex: number;
  name: string;
  parameter: string;
  compareInOrder: boolean;
  autoRunWhenSqlChanges: boolean;
  executionCount: number;
  status: NullableTestCaseStatus;
  error: string | null;
  executionDuration: number | null;
  executionTime: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateTestCaseInput = Omit<TestCaseData, 'id' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<TestCaseData, 'id' | 'createdAt' | 'updatedAt'>>;

export type UpdateTestCaseInput = Partial<Omit<TestCaseData, 'id' | 'createdAt' | 'updatedAt'>>;
