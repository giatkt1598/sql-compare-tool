export type ExecutionResult = 'success' | 'failed' | null;

export interface TestCase {
  id: string;
  profileId: string;
  orderIndex: number;
  name: string;
  parameter: string;
  executionCount: number;
  executionResult: ExecutionResult;
  executionDuration: number | null;
  executionTime: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestCaseFormInput {
  name: string;
  parameter: string;
  enabled: boolean;
}

export const defaultTestCaseFormInput: TestCaseFormInput = {
  name: '',
  parameter: '{}',
  enabled: true,
};
