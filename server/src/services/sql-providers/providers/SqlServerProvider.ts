import mssqlMsNode from 'mssql/msnodesqlv8';
import type { SqlConnection } from '../../../types/profile';
import { SqlProvider } from '../registry';
import type { QueryRows, SqlExecutionContext } from '../types';
import { BaseSqlProvider } from '../types';
import {
  escapeRegex,
  parsePort,
  renderPreviewSqlWithNamedPlaceholders,
} from '../providerUtils';

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
  const isWindowsAuth = connection.authType === 'WindowsAuth';
  const encrypt = Boolean(connection.encrypt ?? true);
  const trustServerCertificate = Boolean(connection.trustServerCertificate ?? true);

  return {
    user: isWindowsAuth ? undefined : String(connection.username ?? ''),
    password: isWindowsAuth ? undefined : String(connection.password ?? ''),
    server: String(connection.host ?? ''),
    port: parsePort(connection.port, 1433),
    database: String(connection.database ?? ''),
    options: {
      encrypt,
      trustServerCertificate,
      trustedConnection: isWindowsAuth,
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

const SQL_SERVER_DRIVER_CANDIDATES = [
  'ODBC Driver 18 for SQL Server',
  'ODBC Driver 17 for SQL Server',
  'SQL Server Native Client 11.0',
  'SQL Server',
];

function isMissingOdbcDriverError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes('Data source name not found and no default driver specified')
  );
}

function createSqlServerPool(
  connection: SqlConnection,
  requestTimeout: number,
  driverName: string
) {
  const config = buildSqlServerConfig(connection, requestTimeout);
  const driverConfig = {
    ...config,
    connectionString: [
      `Driver={${driverName}}`,
      `Server=${config.server},${config.port}`,
      `Database=${config.database}`,
      `Uid=${config.user ?? ''}`,
      `Pwd=${config.password ?? ''}`,
      `Trusted_Connection=${connection.authType === 'WindowsAuth' ? 'Yes' : 'No'}`,
      `Encrypt=${config.options.encrypt ? 'Yes' : 'No'}`,
      `TrustServerCertificate=${config.options.trustServerCertificate ? 'Yes' : 'No'}`,
    ].join(';'),
  };

  return new mssqlMsNode.ConnectionPool(driverConfig);
}

async function safeClosePool(
  pool: { close: () => Promise<unknown> },
  timeoutMs = 1000
): Promise<void> {
  try {
    await Promise.race([
      pool.close().then(() => undefined),
      new Promise<void>((resolve) => {
        setTimeout(resolve, timeoutMs);
      }),
    ]);
  } catch {
    // Ignore pool cleanup errors.
  }
}

async function withTimeout<T>(
  promiseFactory: () => Promise<T>,
  timeoutMs: number,
  message: string,
  onTimeout?: () => Promise<void> | void
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promiseFactory(),
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(async () => {
          try {
            await onTimeout?.();
          } catch {
            // Ignore cleanup error on timeout.
          }
          reject(new Error(message));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

async function connectSqlServerPool(connection: SqlConnection, requestTimeout: number) {
  let lastError: unknown;

  for (const driverName of SQL_SERVER_DRIVER_CANDIDATES) {
    const pool = createSqlServerPool(connection, requestTimeout, driverName);

    try {
      await withTimeout(
        () => pool.connect(),
        8000,
        `SQL Server connection timed out using ${driverName}`,
        () => safeClosePool(pool)
      );
      return pool;
    } catch (error) {
      lastError = error;
      await safeClosePool(pool);
      if (!isMissingOdbcDriverError(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('No supported SQL Server ODBC driver was found');
}

@SqlProvider('SqlServer')
class SqlServerProvider extends BaseSqlProvider {
  readonly provider = 'SqlServer' as const;

  async testConnection(connection: SqlConnection): Promise<void> {
    const pool = await connectSqlServerPool(connection, 5000);

    try {
      await withTimeout(
        () => pool.request().query('SELECT 1 AS ping'),
        8000,
        'SQL Server ping query timed out',
        () => safeClosePool(pool)
      );
    } finally {
      await safeClosePool(pool);
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
    const pool = await connectSqlServerPool(connection, 60000);

    try {
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
      await safeClosePool(pool);
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
