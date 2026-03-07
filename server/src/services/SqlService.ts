import fs from 'node:fs';
import path from 'node:path';
import type { Response } from 'express';
import { FILE_PATHS } from '../config/fileConstants';
import ProfileRepository from '../repositories/ProfileRepository';
import SqlParameterRepository from '../repositories/SqlParameterRepository';
import TestCaseRepository from '../repositories/TestCaseRepository';
import TestCaseEventService from './TestCaseEventService';
import type { ProfileData, SqlProvider } from '../types/profile';
import type { SqlParameterData, SqlParameterDataType } from '../types/sqlParameter';
import type { TestCaseData, TestCaseStatus } from '../types/testCase';
import { getSqlProviderAdapter } from './sql-providers';
import type { QueryRow, QueryRows, SqlExecutionContext } from './sql-providers/types';

interface ResultDiffItem {
  index: number;
  type: 'changed' | 'onlyInOld' | 'onlyInNew';
  oldRecord: QueryRow | null;
  newRecord: QueryRow | null;
}

interface ResultDiffPayload {
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
  differences: ResultDiffItem[];
}

interface RunTestCaseResult {
  success: boolean;
  message: string;
  testCaseId: string;
  profileId: string;
  executionCount: number;
  status: TestCaseStatus;
  error: string | null;
  executionDuration: number;
  executionTime: string;
  files: {
    oldResultPath: string;
    newResultPath: string;
    diffResultPath: string;
  };
  diffSummary: ResultDiffPayload['summary'];
}

interface RunTestCaseDraft {
  name?: string;
  parameter?: string;
  enabled?: boolean;
  compareInOrder?: boolean;
  parallelExecution?: boolean;
}

interface BuildSqlQueryPreviewResult {
  testCaseId: string;
  profileId: string;
  profileName: string;
  sqlProvider: SqlProvider;
  oldSqlFilePath: string;
  newSqlFilePath: string;
  oldSql: string;
  newSql: string;
}

interface RunTestCaseOptions {
  source?: 'manual' | 'auto';
}

interface RunManyTestCasesOptions {
  profileId: string;
  scope: 'all' | 'enabled';
  runInParallel: boolean;
  maxConcurrency: number;
}

interface ActiveExecution {
  id: string;
  testCaseId: string;
  cancelled: boolean;
  cancelReason: string | null;
  cancelHandlers: Set<() => void>;
}

interface LatestTestCaseResult {
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
  status: TestCaseStatus | null;
  error: string | null;
  oldRows: QueryRows;
  newRows: QueryRows;
  diffPayload: ResultDiffPayload;
  files: {
    runDir: string;
    oldResultPath: string;
    newResultPath: string;
    diffResultPath: string;
  };
}

class SqlService {
  private readonly activeExecutions = new Map<string, ActiveExecution>();

  subscribeToTestCaseEvents(testCaseId: string, response: Response): () => void {
    return TestCaseEventService.subscribe(testCaseId, response);
  }

  cancelRun(testCaseId: string, reason: string): boolean {
    const execution = this.activeExecutions.get(testCaseId);
    if (!execution || execution.cancelled) {
      return false;
    }

    execution.cancelled = true;
    execution.cancelReason = reason;
    for (const cancelHandler of execution.cancelHandlers) {
      try {
        cancelHandler();
      } catch {
        // Ignore cancellation handler errors.
      }
    }

    TestCaseEventService.publish(testCaseId, {
      type: 'running',
      testCaseId,
      status: 'running',
      message: reason,
      source: 'auto',
    });

    return true;
  }

  async testConnection(sqlProvider: SqlProvider, connection: ProfileData['sqlConnection']) {
    await getSqlProviderAdapter(sqlProvider).testConnection(connection);

    return {
      success: true,
      message: `Connection to ${sqlProvider} successful`,
      timestamp: new Date().toISOString(),
    };
  }

  async runTestCase(
    testCaseId: string,
    draft?: RunTestCaseDraft,
    options?: RunTestCaseOptions
  ): Promise<RunTestCaseResult> {
    if (this.activeExecutions.has(testCaseId)) {
      throw new Error(`TestCase ${testCaseId} is already running`);
    }

    const startedAt = Date.now();
    const executedAt = new Date().toISOString();
    const source = options?.source ?? 'manual';
    const execution = this.createExecution(testCaseId);
    let nextExecutionCount = 0;
    let oldSql = '';
    let newSql = '';
    let rawParams: Record<string, unknown> = {};
    let effectiveTestCaseSnapshot: TestCaseData | null = null;

    try {
      const testCase = TestCaseRepository.getById(testCaseId);
      if (!testCase) {
        throw new Error(`TestCase with ID ${testCaseId} not found`);
      }

      const profile = ProfileRepository.getById(testCase.profileId);
      if (!profile) {
        throw new Error(`Profile with ID ${testCase.profileId} not found`);
      }

      nextExecutionCount = testCase.executionCount + 1;
      const effectiveTestCase = {
        ...testCase,
        name: draft?.name ?? testCase.name,
        parameter: draft?.parameter ?? testCase.parameter,
        enabled: draft?.enabled ?? testCase.enabled,
        compareInOrder: draft?.compareInOrder ?? testCase.compareInOrder,
        parallelExecution: draft?.parallelExecution ?? testCase.parallelExecution,
      };
      effectiveTestCaseSnapshot = {
        ...testCase.toJSON(),
        name: effectiveTestCase.name,
        parameter: effectiveTestCase.parameter,
        enabled: effectiveTestCase.enabled,
        compareInOrder: effectiveTestCase.compareInOrder,
        parallelExecution: effectiveTestCase.parallelExecution,
      };

      TestCaseRepository.update(testCase.id, {
        status: 'running',
        executionTime: executedAt,
      });
      TestCaseEventService.publish(testCase.id, {
        type: 'running',
        testCaseId: testCase.id,
        status: 'running',
        executionTime: executedAt,
        message: 'Test case is running',
        source,
      });

      this.throwIfCancelled(execution);
      oldSql = this.readSqlFile(profile.oldSqlFilePath, 'oldSqlFilePath');
      newSql = this.readSqlFile(profile.newSqlFilePath, 'newSqlFilePath');

      this.throwIfCancelled(execution);
      rawParams = this.parseTestCaseParameterObject(effectiveTestCase.parameter);
      const sqlParameters = SqlParameterRepository.getByProfileId(profile.id).sort(
        (a, b) => a.index - b.index
      );
      const boundParams = this.mapBoundParameters(sqlParameters, rawParams);

      const oldQuery = {
        label: path.basename(profile.oldSqlFilePath),
        sqlProvider: profile.sqlProvider,
        connection: profile.sqlConnection,
        queryText: oldSql,
        sqlParameters,
        boundParams,
      };
      const newQuery = {
        label: path.basename(profile.newSqlFilePath),
        sqlProvider: profile.sqlProvider,
        connection: profile.sqlConnection,
        queryText: newSql,
        sqlParameters,
        boundParams,
      };
      const queryExecution = effectiveTestCase.parallelExecution
        ? await this.executeQueryPairConcurrently(execution, oldQuery, newQuery)
        : await this.executeQueryPairSequentially(execution, oldQuery, newQuery);
      const { oldRows, newRows, oldSqlDuration, newSqlDuration } = queryExecution;

      this.throwIfCancelled(execution);
      const compareStartedAt = Date.now();
      const diffPayload = this.compareQueryResults(
        oldRows,
        newRows,
        executedAt,
        effectiveTestCase.compareInOrder,
        {
          parallelExecution: effectiveTestCase.parallelExecution,
          oldSqlDuration,
          newSqlDuration,
          compareDuration: Date.now() - compareStartedAt,
        }
      );
      const files = this.writeRunArtifacts(profile.id, testCase.id, nextExecutionCount, {
        oldSql,
        newSql,
        parameterPayload: rawParams,
        testCasePayload: effectiveTestCaseSnapshot,
        oldRows,
        newRows,
        diffPayload,
      });

      const executionDuration = Date.now() - startedAt;
      const status: TestCaseStatus = diffPayload.summary.matched ? 'success' : 'failed';

      TestCaseRepository.update(testCase.id, {
        status,
        error: null,
        executionDuration,
        executionCount: nextExecutionCount,
        executionTime: executedAt,
      });
      TestCaseEventService.publish(testCase.id, {
        type: 'completed',
        testCaseId: testCase.id,
        status,
        executionCount: nextExecutionCount,
        executionTime: executedAt,
        message: 'Run test case completed',
        source,
      });

      return {
        success: true,
        message: 'Run test case completed',
        testCaseId: testCase.id,
        profileId: profile.id,
        executionCount: nextExecutionCount,
        status,
        error: null,
        executionDuration,
        executionTime: executedAt,
        files,
        diffSummary: diffPayload.summary,
      };
    } catch (error) {
      if (this.isCancellationError(error)) {
        throw error;
      }

      const testCase = TestCaseRepository.getById(testCaseId);
      if (!testCase) {
        throw error;
      }

      const profile = ProfileRepository.getById(testCase.profileId);
      if (!profile) {
        throw error;
      }

      const effectiveTestCase = {
        ...testCase,
        name: draft?.name ?? testCase.name,
      };
      const executionDuration = Date.now() - startedAt;
      const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
      const diffPayload = this.buildErrorDiffPayload(executedAt, errorMessage, {
        parallelExecution: draft?.parallelExecution ?? testCase.parallelExecution,
        compareDuration: null,
      });
      const files = this.writeRunArtifacts(profile.id, testCase.id, nextExecutionCount, {
        oldSql,
        newSql,
        parameterPayload: rawParams,
        testCasePayload: effectiveTestCaseSnapshot ?? {
          ...testCase.toJSON(),
          name: effectiveTestCase.name,
        },
        diffPayload,
      });

      try {
        TestCaseRepository.update(testCase.id, {
          status: 'error',
          error: errorMessage,
          executionDuration,
          executionTime: executedAt,
        });
        TestCaseEventService.publish(testCase.id, {
          type: 'error',
          testCaseId: testCase.id,
          status: 'error',
          executionCount: nextExecutionCount,
          executionTime: executedAt,
          message: errorMessage,
          source,
        });
      } catch {
        // Keep original error as the primary one.
      }

      return {
        success: false,
        message: errorMessage,
        testCaseId: testCase.id,
        profileId: profile.id,
        executionCount: nextExecutionCount,
        status: 'error',
        error: errorMessage,
        executionDuration,
        executionTime: executedAt,
        files,
        diffSummary: diffPayload.summary,
      };
    } finally {
      this.clearExecution(execution);
    }
  }

  buildSqlQueryPreview(testCaseId: string, draft?: RunTestCaseDraft): BuildSqlQueryPreviewResult {
    const testCase = TestCaseRepository.getById(testCaseId);
    if (!testCase) {
      throw new Error(`TestCase with ID ${testCaseId} not found`);
    }

    const profile = ProfileRepository.getById(testCase.profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${testCase.profileId} not found`);
    }

    const oldSql = this.readSqlFile(profile.oldSqlFilePath, 'oldSqlFilePath');
    const newSql = this.readSqlFile(profile.newSqlFilePath, 'newSqlFilePath');
    const rawParams = this.parseTestCaseParameterObject(draft?.parameter ?? testCase.parameter);
    const sqlParameters = SqlParameterRepository.getByProfileId(profile.id).sort(
      (a, b) => a.index - b.index
    );
    const boundParams = this.mapBoundParameters(sqlParameters, rawParams);

    return {
      testCaseId: testCase.id,
      profileId: profile.id,
      profileName: profile.name,
      sqlProvider: profile.sqlProvider,
      oldSqlFilePath: profile.oldSqlFilePath,
      newSqlFilePath: profile.newSqlFilePath,
      oldSql: this.renderPreviewSql(profile.sqlProvider, oldSql, sqlParameters, boundParams),
      newSql: this.renderPreviewSql(profile.sqlProvider, newSql, sqlParameters, boundParams),
    };
  }

  runManyTestCases(options: RunManyTestCasesOptions): {
    profileId: string;
    totalSelected: number;
    startedCount: number;
    skippedCount: number;
    startedTestCaseIds: string[];
    skippedTestCaseIds: string[];
    message: string;
  } {
    const profile = ProfileRepository.getById(options.profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${options.profileId} not found`);
    }

    const selectedTestCases = TestCaseRepository.getByProfileId(options.profileId)
      .filter((testCase) => (options.scope === 'enabled' ? testCase.enabled : true))
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const startedTestCases = selectedTestCases.filter(
      (testCase) => !this.activeExecutions.has(testCase.id)
    );
    const skippedTestCases = selectedTestCases.filter((testCase) =>
      this.activeExecutions.has(testCase.id)
    );

    void (async () => {
      if (options.runInParallel) {
        await this.runManyWithConcurrencyLimit(
          startedTestCases.map((testCase) => testCase.id),
          options.maxConcurrency
        );
        return;
      }

      await this.runManyWithConcurrencyLimit(
        startedTestCases.map((testCase) => testCase.id),
        1
      );
    })();

    return {
      profileId: options.profileId,
      totalSelected: selectedTestCases.length,
      startedCount: startedTestCases.length,
      skippedCount: skippedTestCases.length,
      startedTestCaseIds: startedTestCases.map((testCase) => testCase.id),
      skippedTestCaseIds: skippedTestCases.map((testCase) => testCase.id),
      message: `Run many started for ${startedTestCases.length} test case(s) with concurrency limit ${options.runInParallel ? options.maxConcurrency : 1}`,
    };
  }

  private async runManyWithConcurrencyLimit(
    testCaseIds: string[],
    concurrencyLimit: number
  ): Promise<void> {
    if (testCaseIds.length === 0) {
      return;
    }

    let nextIndex = 0;
    const workerCount = Math.min(concurrencyLimit, testCaseIds.length);

    const workers = Array.from({ length: workerCount }, async () => {
      while (nextIndex < testCaseIds.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        const testCaseId = testCaseIds[currentIndex];

        try {
          await this.runTestCase(testCaseId, undefined, { source: 'manual' });
        } catch {
          // Keep batch moving even if one test case fails.
        }
      }
    });

    await Promise.all(workers);
  }

  getLatestTestCaseResult(testCaseId: string): LatestTestCaseResult {
    const testCase = TestCaseRepository.getById(testCaseId);
    if (!testCase) {
      throw new Error(`TestCase with ID ${testCaseId} not found`);
    }

    const profile = ProfileRepository.getById(testCase.profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${testCase.profileId} not found`);
    }

    if (testCase.executionCount <= 0) {
      throw new Error(`No execution result found for testCase ${testCaseId}`);
    }

    const runDir = this.resolveLatestRunDir(profile.id, testCase.id, testCase.executionCount);
    const oldResultPath = path.join(runDir, 'old-result.json');
    const newResultPath = path.join(runDir, 'new-result.json');
    const diffResultPath = path.join(runDir, 'diff-result.json');

    return {
      testCaseId: testCase.id,
      profileId: profile.id,
      name: testCase.name,
      enabled: testCase.enabled,
      compareInOrder: testCase.compareInOrder,
      parallelExecution: testCase.parallelExecution,
      autoRunWhenSqlChanges: testCase.autoRunWhenSqlChanges,
      executionCount: testCase.executionCount,
      executionTime: testCase.executionTime,
      executionDuration: testCase.executionDuration,
      status: testCase.status,
      error: testCase.error,
      oldRows: this.readJsonFile<QueryRows>(oldResultPath, []),
      newRows: this.readJsonFile<QueryRows>(newResultPath, []),
      diffPayload: this.readJsonFile<ResultDiffPayload>(diffResultPath, {
        summary: {
          executionTime: testCase.executionTime ?? '',
          parallelExecution: testCase.parallelExecution,
          oldSqlDuration: null,
          newSqlDuration: null,
          compareDuration: null,
          error: testCase.error ?? undefined,
        },
        differences: [],
      }),
      files: {
        runDir,
        oldResultPath,
        newResultPath,
        diffResultPath,
      },
    };
  }

  private readSqlFile(filePath: string, fieldName: 'oldSqlFilePath' | 'newSqlFilePath'): string {
    if (!filePath || filePath.trim() === '') {
      throw new Error(`${fieldName} is required`);
    }

    const normalizedPath = path.resolve(filePath);
    if (!fs.existsSync(normalizedPath)) {
      throw new Error(`SQL file not found: ${normalizedPath}`);
    }

    const sql = fs.readFileSync(normalizedPath, 'utf8');
    if (!sql.trim()) {
      throw new Error(`SQL file is empty: ${normalizedPath}`);
    }

    return sql;
  }

  private parseTestCaseParameterObject(parameterText: string): Record<string, unknown> {
    if (!parameterText || parameterText.trim() === '') {
      return {};
    }

    try {
      const parsed = JSON.parse(parameterText);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('testCase parameter must be a JSON object');
      }
      return parsed as Record<string, unknown>;
    } catch (error) {
      throw new Error(`Invalid testCase parameter JSON`, { cause: error });
    }
  }

  private mapBoundParameters(
    sqlParameters: Array<{ name: string; dataType: SqlParameterDataType }>,
    rawValues: Record<string, unknown>
  ): Record<string, unknown> {
    const mapped: Record<string, unknown> = {};

    for (const parameter of sqlParameters) {
      const rawValue = rawValues[parameter.name];
      mapped[parameter.name] = this.castParameterValue(rawValue, parameter.dataType);
    }

    return mapped;
  }

  private castParameterValue(value: unknown, dataType: SqlParameterDataType): unknown {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (dataType === 'number') {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        throw new Error(`Parameter value "${String(value)}" is not a valid number`);
      }
      return parsed;
    }

    if (dataType === 'boolean') {
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') {
          return true;
        }
        if (normalized === 'false' || normalized === '0') {
          return false;
        }
      }
      if (typeof value === 'number') {
        if (value === 1) {
          return true;
        }
        if (value === 0) {
          return false;
        }
      }
      throw new Error(`Parameter value "${String(value)}" is not a valid boolean`);
    }

    if (dataType === 'json') {
      return typeof value === 'string' ? value : JSON.stringify(value);
    }

    return String(value);
  }

  private renderPreviewSql(
    sqlProvider: SqlProvider,
    queryText: string,
    sqlParameters: Array<Pick<SqlParameterData, 'name' | 'index' | 'dataType'>>,
    boundParams: Record<string, unknown>
  ): string {
    return getSqlProviderAdapter(sqlProvider).renderPreviewSql(
      queryText,
      sqlParameters,
      boundParams
    );
  }

  private async executeQuery(
    execution: ActiveExecution,
    sqlProvider: SqlProvider,
    connection: ProfileData['sqlConnection'],
    queryText: string,
    sqlParameters: Array<Pick<SqlParameterData, 'name' | 'index' | 'dataType'>>,
    boundParams: Record<string, unknown>
  ): Promise<QueryRows> {
    const context: SqlExecutionContext = {
      cancelled: execution.cancelled,
      throwIfCancelled: () => this.throwIfCancelled(execution),
      registerCancelHandler: (handler) => this.registerCancelHandler(execution, handler),
      createCancellationError: () => this.createCancellationError(execution),
    };
    return getSqlProviderAdapter(sqlProvider).executeQuery(
      context,
      connection,
      queryText,
      sqlParameters,
      boundParams
    );
  }

  private async executeNamedQuery(
    execution: ActiveExecution,
    queryLabel: string,
    sqlProvider: SqlProvider,
    connection: ProfileData['sqlConnection'],
    queryText: string,
    sqlParameters: Array<Pick<SqlParameterData, 'name' | 'index' | 'dataType'>>,
    boundParams: Record<string, unknown>
  ): Promise<QueryRows> {
    try {
      return await this.executeQuery(
        execution,
        sqlProvider,
        connection,
        queryText,
        sqlParameters,
        boundParams
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      throw new Error(`"${queryLabel}": ${message}`, { cause: error });
    }
  }

  private async executeQueryPairConcurrently(
    execution: ActiveExecution,
    oldQuery: {
      label: string;
      sqlProvider: SqlProvider;
      connection: ProfileData['sqlConnection'];
      queryText: string;
      sqlParameters: Array<Pick<SqlParameterData, 'name' | 'index' | 'dataType'>>;
      boundParams: Record<string, unknown>;
    },
    newQuery: {
      label: string;
      sqlProvider: SqlProvider;
      connection: ProfileData['sqlConnection'];
      queryText: string;
      sqlParameters: Array<Pick<SqlParameterData, 'name' | 'index' | 'dataType'>>;
      boundParams: Record<string, unknown>;
    }
  ): Promise<{
    oldRows: QueryRows;
    newRows: QueryRows;
    oldSqlDuration: number;
    newSqlDuration: number;
  }> {
    const runSingleQuery = async (
      query: typeof oldQuery,
      counterpartLabel: string
    ): Promise<{ rows: QueryRows; duration: number }> => {
      const startedAt = Date.now();
      try {
        const rows = await this.executeNamedQuery(
          execution,
          query.label,
          query.sqlProvider,
          query.connection,
          query.queryText,
          query.sqlParameters,
          query.boundParams
        );
        return {
          rows,
          duration: Date.now() - startedAt,
        };
      } catch (error) {
        if (!this.isCancellationError(error)) {
          this.cancelExecutionOnly(
            execution,
            `${counterpartLabel} was cancelled because ${query.label} failed or was interrupted`
          );
        }
        throw error;
      }
    };

    const [oldResult, newResult] = await Promise.allSettled([
      runSingleQuery(oldQuery, newQuery.label),
      runSingleQuery(newQuery, oldQuery.label),
    ]);

    if (oldResult.status === 'rejected') {
      throw oldResult.reason;
    }

    if (newResult.status === 'rejected') {
      throw newResult.reason;
    }

    return {
      oldRows: oldResult.value.rows,
      newRows: newResult.value.rows,
      oldSqlDuration: oldResult.value.duration,
      newSqlDuration: newResult.value.duration,
    };
  }

  private async executeQueryPairSequentially(
    execution: ActiveExecution,
    oldQuery: {
      label: string;
      sqlProvider: SqlProvider;
      connection: ProfileData['sqlConnection'];
      queryText: string;
      sqlParameters: Array<Pick<SqlParameterData, 'name' | 'index' | 'dataType'>>;
      boundParams: Record<string, unknown>;
    },
    newQuery: {
      label: string;
      sqlProvider: SqlProvider;
      connection: ProfileData['sqlConnection'];
      queryText: string;
      sqlParameters: Array<Pick<SqlParameterData, 'name' | 'index' | 'dataType'>>;
      boundParams: Record<string, unknown>;
    }
  ): Promise<{
    oldRows: QueryRows;
    newRows: QueryRows;
    oldSqlDuration: number;
    newSqlDuration: number;
  }> {
    const oldStartedAt = Date.now();
    const oldRows = await this.executeNamedQuery(
      execution,
      oldQuery.label,
      oldQuery.sqlProvider,
      oldQuery.connection,
      oldQuery.queryText,
      oldQuery.sqlParameters,
      oldQuery.boundParams
    );
    const oldSqlDuration = Date.now() - oldStartedAt;
    this.throwIfCancelled(execution);
    const newStartedAt = Date.now();
    const newRows = await this.executeNamedQuery(
      execution,
      newQuery.label,
      newQuery.sqlProvider,
      newQuery.connection,
      newQuery.queryText,
      newQuery.sqlParameters,
      newQuery.boundParams
    );
    const newSqlDuration = Date.now() - newStartedAt;

    return {
      oldRows,
      newRows,
      oldSqlDuration,
      newSqlDuration,
    };
  }

  private createExecution(testCaseId: string): ActiveExecution {
    const execution: ActiveExecution = {
      id: `${testCaseId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      testCaseId,
      cancelled: false,
      cancelReason: null,
      cancelHandlers: new Set(),
    };
    this.activeExecutions.set(testCaseId, execution);
    return execution;
  }

  private clearExecution(execution: ActiveExecution): void {
    const activeExecution = this.activeExecutions.get(execution.testCaseId);
    if (activeExecution?.id === execution.id) {
      this.activeExecutions.delete(execution.testCaseId);
    }
  }

  private registerCancelHandler(execution: ActiveExecution, cancelHandler: () => void): void {
    if (execution.cancelled) {
      try {
        cancelHandler();
      } catch {
        // Ignore cancellation handler errors.
      }
      return;
    }

    execution.cancelHandlers.add(cancelHandler);
  }

  private cancelExecutionOnly(execution: ActiveExecution, reason: string): void {
    if (execution.cancelled) {
      return;
    }

    execution.cancelled = true;
    execution.cancelReason = reason;
    for (const cancelHandler of execution.cancelHandlers) {
      try {
        cancelHandler();
      } catch {
        // Ignore cancellation handler errors.
      }
    }
  }

  private throwIfCancelled(execution: ActiveExecution): void {
    if (execution.cancelled) {
      throw this.createCancellationError(execution);
    }
  }

  private createCancellationError(execution: ActiveExecution): Error {
    const error = new Error(execution.cancelReason ?? 'Run cancelled');
    error.name = 'RunCancellationError';
    return error;
  }

  private isCancellationError(error: unknown): boolean {
    return error instanceof Error && error.name === 'RunCancellationError';
  }

  private compareQueryResults(
    oldRows: QueryRows,
    newRows: QueryRows,
    executionTime: string,
    compareInOrder: boolean,
    executionMetadata: {
      parallelExecution: boolean;
      oldSqlDuration: number;
      newSqlDuration: number;
      compareDuration: number;
    }
  ): ResultDiffPayload {
    if (compareInOrder) {
      return this.compareQueryResultsInOrder(oldRows, newRows, executionTime, executionMetadata);
    }

    return this.compareQueryResultsIgnoreOrder(oldRows, newRows, executionTime, executionMetadata);
  }

  private compareQueryResultsInOrder(
    oldRows: QueryRows,
    newRows: QueryRows,
    executionTime: string,
    executionMetadata: {
      parallelExecution: boolean;
      oldSqlDuration: number;
      newSqlDuration: number;
      compareDuration: number;
    }
  ): ResultDiffPayload {
    const differences: ResultDiffItem[] = [];
    let onlyInOldCount = 0;
    let onlyInNewCount = 0;
    let changedCount = 0;
    const maxLength = Math.max(oldRows.length, newRows.length);

    for (let i = 0; i < maxLength; i += 1) {
      const oldRecord = oldRows[i] ?? null;
      const newRecord = newRows[i] ?? null;

      if (oldRecord && !newRecord) {
        onlyInOldCount += 1;
        differences.push({
          index: i,
          type: 'onlyInOld',
          oldRecord,
          newRecord: null,
        });
        continue;
      }

      if (!oldRecord && newRecord) {
        onlyInNewCount += 1;
        differences.push({
          index: i,
          type: 'onlyInNew',
          oldRecord: null,
          newRecord,
        });
        continue;
      }

      if (oldRecord && newRecord && !this.deepEqual(oldRecord, newRecord)) {
        changedCount += 1;
        differences.push({
          index: i,
          type: 'changed',
          oldRecord,
          newRecord,
        });
      }
    }

    return {
      summary: {
        executionTime,
        parallelExecution: executionMetadata.parallelExecution,
        oldSqlDuration: executionMetadata.oldSqlDuration,
        newSqlDuration: executionMetadata.newSqlDuration,
        compareDuration: executionMetadata.compareDuration,
        oldCount: oldRows.length,
        newCount: newRows.length,
        differenceCount: differences.length,
        onlyInOldCount,
        onlyInNewCount,
        changedCount,
        matched: differences.length === 0,
      },
      differences,
    };
  }

  private compareQueryResultsIgnoreOrder(
    oldRows: QueryRows,
    newRows: QueryRows,
    executionTime: string,
    executionMetadata: {
      parallelExecution: boolean;
      oldSqlDuration: number;
      newSqlDuration: number;
      compareDuration: number;
    }
  ): ResultDiffPayload {
    const differences: ResultDiffItem[] = [];
    let onlyInOldCount = 0;
    let onlyInNewCount = 0;
    let changedCount = 0;
    const unmatchedOld = this.collectUnmatchedRows(oldRows, newRows);
    const unmatchedNew = this.collectUnmatchedRows(newRows, oldRows);
    const maxLength = Math.max(unmatchedOld.length, unmatchedNew.length);

    for (let i = 0; i < maxLength; i += 1) {
      const oldRecord = unmatchedOld[i] ?? null;
      const newRecord = unmatchedNew[i] ?? null;

      if (oldRecord && newRecord) {
        changedCount += 1;
        differences.push({
          index: i,
          type: 'changed',
          oldRecord,
          newRecord,
        });
        continue;
      }

      if (oldRecord) {
        onlyInOldCount += 1;
        differences.push({
          index: i,
          type: 'onlyInOld',
          oldRecord,
          newRecord: null,
        });
        continue;
      }

      if (newRecord) {
        onlyInNewCount += 1;
        differences.push({
          index: i,
          type: 'onlyInNew',
          oldRecord: null,
          newRecord,
        });
      }
    }

    return {
      summary: {
        executionTime,
        parallelExecution: executionMetadata.parallelExecution,
        oldSqlDuration: executionMetadata.oldSqlDuration,
        newSqlDuration: executionMetadata.newSqlDuration,
        compareDuration: executionMetadata.compareDuration,
        oldCount: oldRows.length,
        newCount: newRows.length,
        differenceCount: differences.length,
        onlyInOldCount,
        onlyInNewCount,
        changedCount,
        matched: differences.length === 0,
      },
      differences,
    };
  }

  private collectUnmatchedRows(sourceRows: QueryRows, targetRows: QueryRows): QueryRows {
    const targetBuckets = new Map<string, QueryRow[]>();

    for (const row of targetRows) {
      const key = this.toCanonicalKey(row);
      const bucket = targetBuckets.get(key) ?? [];
      bucket.push(row);
      targetBuckets.set(key, bucket);
    }

    const unmatched: Array<{ key: string; row: QueryRow }> = [];

    for (const row of sourceRows) {
      const key = this.toCanonicalKey(row);
      const bucket = targetBuckets.get(key);
      if (bucket && bucket.length > 0) {
        bucket.pop();
        if (bucket.length === 0) {
          targetBuckets.delete(key);
        } else {
          targetBuckets.set(key, bucket);
        }
        continue;
      }

      unmatched.push({ key, row });
    }

    return unmatched
      .sort((left, right) => left.key.localeCompare(right.key))
      .map((item) => item.row);
  }

  private buildErrorDiffPayload(
    executionTime: string,
    error: string,
    metadata?: {
      parallelExecution?: boolean;
      oldSqlDuration?: number | null;
      newSqlDuration?: number | null;
      compareDuration?: number | null;
    }
  ): ResultDiffPayload {
    return {
      summary: {
        executionTime,
        parallelExecution: metadata?.parallelExecution,
        oldSqlDuration: metadata?.oldSqlDuration ?? null,
        newSqlDuration: metadata?.newSqlDuration ?? null,
        compareDuration: metadata?.compareDuration ?? null,
        error,
      },
      differences: [],
    };
  }

  private deepEqual(left: unknown, right: unknown): boolean {
    return JSON.stringify(this.canonicalize(left)) === JSON.stringify(this.canonicalize(right));
  }

  private canonicalize(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.canonicalize(item));
    }

    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
        a.localeCompare(b)
      );
      return Object.fromEntries(entries.map(([key, item]) => [key, this.canonicalize(item)]));
    }

    return value;
  }

  private toCanonicalKey(value: unknown): string {
    return JSON.stringify(this.canonicalize(value));
  }

  private writeRunArtifacts(
    profileId: string,
    testCaseId: string,
    executionCount: number,
    payload: {
      oldSql: string;
      newSql: string;
      parameterPayload: Record<string, unknown>;
      testCasePayload: TestCaseData;
      diffPayload: ResultDiffPayload;
      oldRows?: QueryRows;
      newRows?: QueryRows;
    }
  ): {
    oldResultPath: string;
    newResultPath: string;
    diffResultPath: string;
  } {
    const formattedExecutionCount = this.formatExecutionCount(executionCount);
    const runDir = path.join(
      FILE_PATHS.RESULTS,
      profileId,
      testCaseId,
      `${testCaseId}-${formattedExecutionCount}`
    );
    fs.mkdirSync(runDir, { recursive: true });
    const dataDir = path.join(runDir, 'data');
    fs.mkdirSync(dataDir, { recursive: true });

    const oldResultPath = path.join(runDir, 'old-result.json');
    const newResultPath = path.join(runDir, 'new-result.json');
    const diffResultPath = path.join(runDir, 'diff-result.json');
    const oldSqlPath = path.join(dataDir, 'old.sql');
    const newSqlPath = path.join(dataDir, 'new.sql');
    const parameterPath = path.join(dataDir, 'parameter.json');
    const testCasePath = path.join(dataDir, 'test-case.json');

    if (payload.oldRows) {
      fs.writeFileSync(oldResultPath, JSON.stringify(payload.oldRows, null, 2), 'utf8');
    }
    if (payload.newRows) {
      fs.writeFileSync(newResultPath, JSON.stringify(payload.newRows, null, 2), 'utf8');
    }
    fs.writeFileSync(diffResultPath, JSON.stringify(payload.diffPayload, null, 2), 'utf8');
    if (payload.oldSql) {
      fs.writeFileSync(oldSqlPath, payload.oldSql, 'utf8');
    }
    if (payload.newSql) {
      fs.writeFileSync(newSqlPath, payload.newSql, 'utf8');
    }
    fs.writeFileSync(parameterPath, JSON.stringify(payload.parameterPayload, null, 2), 'utf8');
    fs.writeFileSync(testCasePath, JSON.stringify(payload.testCasePayload, null, 2), 'utf8');

    return {
      oldResultPath,
      newResultPath,
      diffResultPath,
    };
  }

  private formatExecutionCount(value: number): string {
    return String(value).padStart(4, '0');
  }

  private resolveLatestRunDir(
    profileId: string,
    testCaseId: string,
    executionCount: number
  ): string {
    const expectedDir = path.join(
      FILE_PATHS.RESULTS,
      profileId,
      testCaseId,
      `${testCaseId}-${this.formatExecutionCount(executionCount)}`
    );

    if (fs.existsSync(expectedDir)) {
      return expectedDir;
    }

    throw new Error(`Latest result directory not found for testCase ${testCaseId}`);
  }

  private readJsonFile<T>(filePath: string, fallback: T): T {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.trim()) {
      return fallback;
    }

    return JSON.parse(content) as T;
  }
}

export default new SqlService();
