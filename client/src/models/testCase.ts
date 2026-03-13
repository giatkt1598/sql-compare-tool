export type TestCaseStatus = 'success' | 'failed' | 'running' | 'error' | null;

export interface LatestResultSummary {
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
}

export interface TestCase {
  id: string;
  profileId: string;
  orderIndex: number;
  name: string;
  parameter: string;
  compareInOrder: boolean;
  parallelExecution: boolean;
  autoRunWhenSqlChanges: boolean;
  executionCount: number;
  status: TestCaseStatus;
  error: string | null;
  executionDuration: number | null;
  executionTime: string | null;
  latestResultSummary: LatestResultSummary | null;
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
  autoRunWhenSqlChanges: boolean;
}

export const defaultTestCaseFormInput: TestCaseFormInput = {
  name: '',
  parameter: '{}',
  enabled: true,
  compareInOrder: false,
  parallelExecution: true,
  autoRunWhenSqlChanges: false,
};
