export const TEST_CASE_EXECUTION_RESULTS = ['success', 'failed'] as const;

export type TestCaseExecutionResult = (typeof TEST_CASE_EXECUTION_RESULTS)[number];
export type NullableTestCaseExecutionResult = TestCaseExecutionResult | null;

export interface TestCaseData {
  id: string;
  profileId: string;
  orderIndex: number;
  name: string;
  parameter: string;
  executionCount: number;
  executionResult: NullableTestCaseExecutionResult;
  executionDuration: number | null;
  executionTime: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateTestCaseInput = Omit<TestCaseData, 'id' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<TestCaseData, 'id' | 'createdAt' | 'updatedAt'>>;

export type UpdateTestCaseInput = Partial<Omit<TestCaseData, 'id' | 'createdAt' | 'updatedAt'>>;
