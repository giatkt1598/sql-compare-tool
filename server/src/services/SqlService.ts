import fs from 'node:fs';
import path from 'node:path';
import mssql from 'mssql';
import { Client as PgClient, type ClientConfig as PgClientConfig } from 'pg';
import { FILE_PATHS } from '../config/fileConstants';
import ProfileRepository from '../repositories/ProfileRepository';
import SqlParameterRepository from '../repositories/SqlParameterRepository';
import TestCaseRepository from '../repositories/TestCaseRepository';
import type { ProfileData, SqlProvider } from '../types/profile';
import type { SqlParameterData, SqlParameterDataType } from '../types/sqlParameter';
import type { TestCaseExecutionResult } from '../types/testCase';

type QueryRow = Record<string, unknown>;
type QueryRows = QueryRow[];

interface ResultDiffItem {
  index: number;
  type: 'changed' | 'onlyInOld' | 'onlyInNew';
  oldRecord: QueryRow | null;
  newRecord: QueryRow | null;
}

interface ResultDiffPayload {
  summary: {
    executionTime: string;
    oldCount: number;
    newCount: number;
    differenceCount: number;
    onlyInOldCount: number;
    onlyInNewCount: number;
    changedCount: number;
    matched: boolean;
  };
  differences: ResultDiffItem[];
}

interface RunTestCaseResult {
  success: boolean;
  message: string;
  testCaseId: string;
  profileId: string;
  executionCount: number;
  executionResult: TestCaseExecutionResult;
  executionDuration: number;
  executionTime: string;
  files: {
    oldResultPath: string;
    newResultPath: string;
    diffResultPath: string;
  };
  diffSummary: ResultDiffPayload['summary'];
}

class SqlService {
  async testConnection(sqlProvider: SqlProvider, connection: ProfileData['sqlConnection']) {
    if (!connection.host) {
      throw new Error('Database host is required');
    }

    if (!connection.username) {
      throw new Error('Database username is required');
    }

    if (sqlProvider === 'SqlServer') {
      await this.testSqlServerConnection(connection);
    } else if (sqlProvider === 'Postgres') {
      await this.testPostgresConnection(connection);
    } else {
      throw new Error(`Unsupported SQL provider: ${sqlProvider}`);
    }

    return {
      success: true,
      message: `Connection to ${sqlProvider} successful`,
      timestamp: new Date().toISOString(),
    };
  }

  private parsePort(value: unknown, fallback: number): number {
    const parsed = Number.parseInt(String(value ?? fallback), 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  async runTestCase(testCaseId: string): Promise<RunTestCaseResult> {
    const startedAt = Date.now();
    const executedAt = new Date().toISOString();

    const testCase = TestCaseRepository.getById(testCaseId);
    if (!testCase) {
      throw new Error(`TestCase with ID ${testCaseId} not found`);
    }

    const profile = ProfileRepository.getById(testCase.profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${testCase.profileId} not found`);
    }

    const nextExecutionCount = testCase.executionCount + 1;

    try {
      const oldSql = this.readSqlFile(profile.oldSqlFilePath, 'oldSqlFilePath');
      const newSql = this.readSqlFile(profile.newSqlFilePath, 'newSqlFilePath');

      const rawParams = this.parseTestCaseParameterObject(testCase.parameter);
      const sqlParameters = SqlParameterRepository.getByProfileId(profile.id).sort(
        (a, b) => a.index - b.index
      );
      const boundParams = this.mapBoundParameters(sqlParameters, rawParams);

      const oldRows = await this.executeQuery(
        profile.sqlProvider,
        profile.sqlConnection,
        oldSql,
        sqlParameters,
        boundParams
      );
      const newRows = await this.executeQuery(
        profile.sqlProvider,
        profile.sqlConnection,
        newSql,
        sqlParameters,
        boundParams
      );

      const diffPayload = this.compareQueryResults(oldRows, newRows, executedAt);
      const files = this.writeRunArtifacts(profile.name, testCase.name, nextExecutionCount, {
        oldRows,
        newRows,
        diffPayload,
      });

      const executionDuration = Date.now() - startedAt;
      const executionResult: TestCaseExecutionResult = diffPayload.summary.matched
        ? 'success'
        : 'failed';

      TestCaseRepository.update(testCase.id, {
        executionCount: nextExecutionCount,
        executionResult,
        executionDuration,
        executionTime: executedAt,
      });

      return {
        success: true,
        message: 'Run test case completed',
        testCaseId: testCase.id,
        profileId: profile.id,
        executionCount: nextExecutionCount,
        executionResult,
        executionDuration,
        executionTime: executedAt,
        files,
        diffSummary: diffPayload.summary,
      };
    } catch (error) {
      const executionDuration = Date.now() - startedAt;

      try {
        TestCaseRepository.update(testCase.id, {
          executionCount: nextExecutionCount,
          executionResult: 'failed',
          executionDuration,
          executionTime: executedAt,
        });
      } catch {
        // Keep original error as the primary one.
      }

      throw error;
    }
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

  private async executeQuery(
    sqlProvider: SqlProvider,
    connection: ProfileData['sqlConnection'],
    queryText: string,
    sqlParameters: Array<Pick<SqlParameterData, 'name' | 'index' | 'dataType'>>,
    boundParams: Record<string, unknown>
  ): Promise<QueryRows> {
    if (sqlProvider === 'SqlServer') {
      return this.executeSqlServerQuery(connection, queryText, sqlParameters, boundParams);
    }
    if (sqlProvider === 'Postgres') {
      return this.executePostgresQuery(connection, queryText, sqlParameters, boundParams);
    }

    throw new Error(`Unsupported SQL provider: ${sqlProvider}`);
  }

  private async testSqlServerConnection(connection: ProfileData['sqlConnection']) {
    const pool = new mssql.ConnectionPool({
      user: String(connection.username ?? ''),
      password: String(connection.password ?? ''),
      server: String(connection.host ?? ''),
      port: this.parsePort(connection.port, 1433),
      database: String(connection.database ?? ''),
      options: {
        encrypt: Boolean(connection.encrypt ?? true),
        trustServerCertificate: Boolean(connection.trustServerCertificate ?? true),
      },
      connectionTimeout: 5000,
      requestTimeout: 5000,
      pool: {
        max: 1,
        min: 0,
        idleTimeoutMillis: 5000,
      },
    });

    try {
      await pool.connect();
      await pool.request().query('SELECT 1 AS ping');
    } finally {
      await pool.close();
    }
  }

  private async executeSqlServerQuery(
    connection: ProfileData['sqlConnection'],
    queryText: string,
    sqlParameters: Array<Pick<SqlParameterData, 'name' | 'index' | 'dataType'>>,
    boundParams: Record<string, unknown>
  ): Promise<QueryRows> {
    const normalizedQueryText = this.normalizeSqlServerQuery(queryText, sqlParameters);
    const pool = new mssql.ConnectionPool({
      user: String(connection.username ?? ''),
      password: String(connection.password ?? ''),
      server: String(connection.host ?? ''),
      port: this.parsePort(connection.port, 1433),
      database: String(connection.database ?? ''),
      options: {
        encrypt: Boolean(connection.encrypt ?? true),
        trustServerCertificate: Boolean(connection.trustServerCertificate ?? true),
      },
      connectionTimeout: 5000,
      requestTimeout: 60000,
      pool: {
        max: 1,
        min: 0,
        idleTimeoutMillis: 5000,
      },
    });

    try {
      await pool.connect();
      const request = pool.request();
      for (const parameter of [...sqlParameters].sort((a, b) => a.index - b.index)) {
        request.input(parameter.name, boundParams[parameter.name] ?? null);
      }
      const result = await request.query(normalizedQueryText);
      return (result.recordset ?? []) as QueryRows;
    } finally {
      await pool.close();
    }
  }

  private normalizeSqlServerQuery(
    queryText: string,
    sqlParameters: Array<Pick<SqlParameterData, 'name' | 'dataType'>>
  ): string {
    let normalized = queryText;
    for (const parameter of sqlParameters) {
      const escapedName = this.escapeRegex(parameter.name);
      normalized = normalized.replace(new RegExp(`:${escapedName}\\b`, 'g'), `@${parameter.name}`);
      normalized = normalized.replace(
        new RegExp(`\\{\\{\\s*${escapedName}\\s*\\}\\}`, 'g'),
        `@${parameter.name}`
      );
    }
    return normalized;
  }

  private async testPostgresConnection(connection: ProfileData['sqlConnection']) {
    const sslMode = String(connection.sslMode ?? 'prefer').toLowerCase();
    const pgConfig: PgClientConfig = {
      host: String(connection.host ?? ''),
      port: this.parsePort(connection.port, 5432),
      database: String(connection.database ?? 'postgres'),
      user: String(connection.username ?? ''),
      password: String(connection.password ?? ''),
      connectionTimeoutMillis: 5000,
      statement_timeout: 5000,
      query_timeout: 5000,
    };

    if (['require', 'verify-ca', 'verify-full'].includes(sslMode)) {
      pgConfig.ssl = {
        rejectUnauthorized: sslMode !== 'require',
      };
    } else {
      pgConfig.ssl = false;
    }

    const client = new PgClient(pgConfig);
    try {
      await client.connect();
      await client.query('SELECT 1 AS ping');
    } finally {
      await client.end();
    }
  }

  private async executePostgresQuery(
    connection: ProfileData['sqlConnection'],
    queryText: string,
    sqlParameters: Array<Pick<SqlParameterData, 'name' | 'index' | 'dataType'>>,
    boundParams: Record<string, unknown>
  ): Promise<QueryRows> {
    const pgConfig = this.buildPostgresConfig(connection, 60000);
    const prepared = this.preparePostgresQuery(queryText, sqlParameters, boundParams);
    const client = new PgClient(pgConfig);

    try {
      await client.connect();
      const result = await client.query(prepared.text, prepared.values);
      return (result.rows ?? []) as QueryRows;
    } finally {
      await client.end();
    }
  }

  private buildPostgresConfig(
    connection: ProfileData['sqlConnection'],
    timeoutMs: number
  ): PgClientConfig {
    const sslMode = String(connection.sslMode ?? 'prefer').toLowerCase();
    const pgConfig: PgClientConfig = {
      host: String(connection.host ?? ''),
      port: this.parsePort(connection.port, 5432),
      database: String(connection.database ?? 'postgres'),
      user: String(connection.username ?? ''),
      password: String(connection.password ?? ''),
      connectionTimeoutMillis: 5000,
      statement_timeout: timeoutMs,
      query_timeout: timeoutMs,
    };

    if (['require', 'verify-ca', 'verify-full'].includes(sslMode)) {
      pgConfig.ssl = {
        rejectUnauthorized: sslMode !== 'require',
      };
    } else {
      pgConfig.ssl = false;
    }

    return pgConfig;
  }

  private preparePostgresQuery(
    queryText: string,
    sqlParameters: Array<Pick<SqlParameterData, 'name' | 'index' | 'dataType'>>,
    boundParams: Record<string, unknown>
  ): { text: string; values: unknown[] } {
    let preparedText = queryText;
    const values: unknown[] = [];
    const placeholderIndexByName = new Map<string, number>();

    const sortedParameters = [...sqlParameters].sort((a, b) => a.index - b.index);
    for (const parameter of sortedParameters) {
      const escapedName = this.escapeRegex(parameter.name);
      const matchesNamedPlaceholder =
        new RegExp(`@${escapedName}\\b`).test(preparedText) ||
        new RegExp(`:${escapedName}\\b`).test(preparedText) ||
        new RegExp(`\\{\\{\\s*${escapedName}\\s*\\}\\}`).test(preparedText);

      if (!matchesNamedPlaceholder) {
        continue;
      }

      if (!placeholderIndexByName.has(parameter.name)) {
        placeholderIndexByName.set(parameter.name, values.length + 1);
        values.push(boundParams[parameter.name] ?? null);
      }

      const placeholderIndex = placeholderIndexByName.get(parameter.name) as number;
      const typedPlaceholder = this.buildPostgresTypedPlaceholder(
        placeholderIndex,
        parameter.dataType
      );
      preparedText = preparedText.replace(new RegExp(`@${escapedName}\\b`, 'g'), typedPlaceholder);
      preparedText = preparedText.replace(new RegExp(`:${escapedName}\\b`, 'g'), typedPlaceholder);
      preparedText = preparedText.replace(
        new RegExp(`\\{\\{\\s*${escapedName}\\s*\\}\\}`, 'g'),
        typedPlaceholder
      );
    }

    if (values.length === 0 && /\$\d+/.test(preparedText)) {
      const indexes = [...preparedText.matchAll(/\$(\d+)/g)].map((match) => Number(match[1]));
      const maxIndex = indexes.length > 0 ? Math.max(...indexes) : 0;
      for (let i = 0; i < maxIndex; i += 1) {
        const parameter = sortedParameters[i];
        values.push(parameter ? (boundParams[parameter.name] ?? null) : null);
      }
    }

    preparedText = preparedText.replace(/\s+/g, ' ').trim();

    return { text: preparedText, values };
  }

  private buildPostgresTypedPlaceholder(
    placeholderIndex: number,
    dataType: SqlParameterDataType
  ): string {
    const base = `$${placeholderIndex}`;
    if (dataType === 'number') {
      return `${base}::numeric`;
    }
    if (dataType === 'boolean') {
      return `${base}::boolean`;
    }
    if (dataType === 'date') {
      return `${base}::date`;
    }
    if (dataType === 'datetime') {
      return `${base}::timestamptz`;
    }
    if (dataType === 'json') {
      return `${base}::jsonb`;
    }
    if (dataType === 'uuid') {
      return `${base}::uuid`;
    }
    return `${base}::text`;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private compareQueryResults(
    oldRows: QueryRows,
    newRows: QueryRows,
    executionTime: string
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

  private writeRunArtifacts(
    profileName: string,
    testCaseName: string,
    executionCount: number,
    payload: {
      oldRows: QueryRows;
      newRows: QueryRows;
      diffPayload: ResultDiffPayload;
    }
  ): {
    oldResultPath: string;
    newResultPath: string;
    diffResultPath: string;
  } {
    const safeProfileName = this.toSafePathSegment(profileName);
    const safeTestCaseName = this.toSafePathSegment(testCaseName);
    const runDir = path.join(
      FILE_PATHS.RESULTS,
      safeProfileName,
      safeTestCaseName,
      `${safeTestCaseName}-${executionCount}`
    );
    fs.mkdirSync(runDir, { recursive: true });

    const oldResultPath = path.join(runDir, 'old-result.json');
    const newResultPath = path.join(runDir, 'new-result.json');
    const diffResultPath = path.join(runDir, 'diff-result.json');

    fs.writeFileSync(oldResultPath, JSON.stringify(payload.oldRows, null, 2), 'utf8');
    fs.writeFileSync(newResultPath, JSON.stringify(payload.newRows, null, 2), 'utf8');
    fs.writeFileSync(diffResultPath, JSON.stringify(payload.diffPayload, null, 2), 'utf8');

    return {
      oldResultPath,
      newResultPath,
      diffResultPath,
    };
  }

  private toSafePathSegment(value: string): string {
    const sanitized = value
      .trim()
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
      .replace(/\s+/g, ' ');
    return sanitized || 'unnamed';
  }
}

export default new SqlService();
