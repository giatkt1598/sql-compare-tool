import mssql from 'mssql';
import type { SqlConnection } from '../../types/profile';
import { SqlProvider } from './registry';
import type { QueryRows, SqlExecutionContext } from './types';
import { BaseSqlProvider } from './types';
import {
  escapeRegex,
  parsePort,
  renderPreviewSqlWithNamedPlaceholders,
} from './providerUtils';

function normalizeSqlServerQuery(
  queryText: string,
  sqlParameters: Parameters<BaseSqlProvider['renderPreviewSql']>[1]
): string {
  let normalized = queryText;
  for (const parameter of sqlParameters) {
    const escapedName = escapeRegex(parameter.name);
    normalized = normalized.replace(new RegExp(`:${escapedName}\\b`, 'g'), `@${parameter.name}`);
    normalized = normalized.replace(
      new RegExp(`\\{\\{\\s*${escapedName}\\s*\\}\\}`, 'g'),
      `@${parameter.name}`
    );
  }
  return normalized;
}

function buildSqlServerConfig(connection: SqlConnection, requestTimeout: number) {
  return {
    user: String(connection.username ?? ''),
    password: String(connection.password ?? ''),
    server: String(connection.host ?? ''),
    port: parsePort(connection.port, 1433),
    database: String(connection.database ?? ''),
    options: {
      encrypt: Boolean(connection.encrypt ?? true),
      trustServerCertificate: Boolean(connection.trustServerCertificate ?? true),
    },
    connectionTimeout: 5000,
    requestTimeout,
    pool: {
      max: 1,
      min: 0,
      idleTimeoutMillis: 5000,
    },
  };
}

@SqlProvider('SqlServer')
class SqlServerProvider extends BaseSqlProvider {
  readonly provider = 'SqlServer' as const;

  async testConnection(connection: SqlConnection): Promise<void> {
    const pool = new mssql.ConnectionPool(buildSqlServerConfig(connection, 5000));

    try {
      await pool.connect();
      await pool.request().query('SELECT 1 AS ping');
    } finally {
      await pool.close();
    }
  }

  async executeQuery(
    context: SqlExecutionContext,
    connection: SqlConnection,
    queryText: string,
    sqlParameters: Parameters<BaseSqlProvider['renderPreviewSql']>[1],
    boundParams: Record<string, unknown>
  ): Promise<QueryRows> {
    const normalizedQueryText = normalizeSqlServerQuery(queryText, sqlParameters);
    const pool = new mssql.ConnectionPool(buildSqlServerConfig(connection, 60000));

    try {
      await pool.connect();
      context.throwIfCancelled();
      const request = pool.request();
      context.registerCancelHandler(() => {
        request.cancel();
      });
      for (const parameter of [...sqlParameters].sort((a, b) => a.index - b.index)) {
        request.input(parameter.name, boundParams[parameter.name] ?? null);
      }
      const result = await request.query(normalizedQueryText);
      return (result.recordset ?? []) as Array<Record<string, unknown>>;
    } catch (error) {
      if (
        context.cancelled ||
        (error instanceof Error &&
          ('code' in error ? String((error as { code?: unknown }).code) === 'ECANCEL' : false))
      ) {
        throw context.createCancellationError();
      }
      throw error;
    } finally {
      await pool.close();
    }
  }

  renderPreviewSql(
    queryText: string,
    sqlParameters: Parameters<BaseSqlProvider['renderPreviewSql']>[1],
    boundParams: Record<string, unknown>
  ): string {
    return renderPreviewSqlWithNamedPlaceholders(
      'SqlServer',
      queryText,
      sqlParameters,
      boundParams,
      normalizeSqlServerQuery
    );
  }
}

export default SqlServerProvider;
