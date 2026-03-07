export type TestCaseStatus = 'success' | 'failed' | 'running' | 'error' | null;

export interface TestCase {
  id: string;
  profileId: string;
  orderIndex: number;
  name: string;
  parameter: string;
  compareInOrder: boolean;
  parallelExecution: boolean;
  expectedExecutionDuration: number | null;
  autoRunWhenSqlChanges: boolean;
  executionCount: number;
  status: TestCaseStatus;
  error: string | null;
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
  compareInOrder: boolean;
  parallelExecution: boolean;
  expectedExecutionDuration: string;
  autoRunWhenSqlChanges: boolean;
}

export const defaultTestCaseFormInput: TestCaseFormInput = {
  name: '',
  parameter: '{}',
  enabled: true,
  compareInOrder: false,
  parallelExecution: true,
  expectedExecutionDuration: '',
  autoRunWhenSqlChanges: false,
};
