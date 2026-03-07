import type { ProfileFormInput, SqlProvider } from '../models/profile';
import type { TestCaseStatus } from '../models/testCase';

export type SqlTestConnectionPayload = Pick<ProfileFormInput, 'sqlProvider' | 'sqlConnection'>;

export interface SqlTestConnectionResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface RunTestCaseDraftPayload {
  name?: string;
  parameter?: string;
  enabled?: boolean;
  compareInOrder?: boolean;
  parallelExecution?: boolean;
}

export interface SqlRunManyTestCasesPayload {
  profileId: string;
  scope: 'all' | 'enabled';
  runInParallel: boolean;
  maxConcurrency: number;
}

export interface SqlDiffSummary {
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

export interface SqlRunResultFiles {
  oldResultPath: string;
  newResultPath: string;
  diffResultPath: string;
}

export interface SqlDiffItem {
  index: number;
  type: 'changed' | 'onlyInOld' | 'onlyInNew';
  oldRecord: Record<string, unknown> | null;
  newRecord: Record<string, unknown> | null;
}

export interface SqlRunTestCaseResponse {
  success: boolean;
  message: string;
  testCaseId: string;
  profileId: string;
  executionCount: number;
  status: Exclude<TestCaseStatus, null>;
  error: string | null;
  executionDuration: number;
  executionTime: string;
  files: SqlRunResultFiles;
  diffSummary: SqlDiffSummary;
}

export interface SqlBuildTestCaseQueryResponse {
  testCaseId: string;
  profileId: string;
  profileName: string;
  sqlProvider: SqlProvider | string;
  oldSqlFilePath: string;
  newSqlFilePath: string;
  oldSql: string;
  newSql: string;
}

export interface SqlRunManyTestCasesResponse {
  success: boolean;
  profileId: string;
  totalSelected: number;
  startedCount: number;
  skippedCount: number;
  startedTestCaseIds: string[];
  skippedTestCaseIds: string[];
  message: string;
}

export interface SqlLatestTestCaseResultResponse {
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
  status: TestCaseStatus;
  error: string | null;
  oldRows: Array<Record<string, unknown>>;
  newRows: Array<Record<string, unknown>>;
  diffPayload: {
    summary: SqlDiffSummary;
    differences: SqlDiffItem[];
  };
  files: {
    runDir: string;
    oldResultPath: string;
    newResultPath: string;
    diffResultPath: string;
  };
}
