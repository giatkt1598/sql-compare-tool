import {
  Client as PgClient,
  type ClientConfig as PgClientConfig,
  type QueryResult as PgQueryResult,
} from 'pg';
import type { SqlConnection } from '../../../types/profile';
import type { SqlParameterDataType } from '../../../types/sqlParameter';
import { SqlProvider } from '../registry';
import {
  BaseSqlProvider,
  type BoundSqlParameter,
  type QueryRows,
  type SqlExecutionContext,
} from '../types';
import { escapeRegex, parsePort, renderPreviewSqlWithNamedPlaceholders } from '../providerUtils';

function buildPostgresConfig(connection: SqlConnection, timeoutMs: number): PgClientConfig {
  const sslMode = String(connection.sslMode ?? 'prefer').toLowerCase();
  const pgConfig: PgClientConfig = {
    host: String(connection.host ?? ''),
    port: parsePort(connection.port, 5432),
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

function buildPostgresTypedPlaceholder(
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

function preparePostgresQuery(
  queryText: string,
  sqlParameters: BoundSqlParameter[],
  boundParams: Record<string, unknown>
): { text: string; values: unknown[] } {
  let preparedText = queryText;
  const values: unknown[] = [];
  const placeholderIndexByName = new Map<string, number>();

  const sortedParameters = [...sqlParameters].sort((a, b) => a.index - b.index);
  for (const parameter of sortedParameters) {
    const escapedName = escapeRegex(parameter.name);
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
    const typedPlaceholder = buildPostgresTypedPlaceholder(placeholderIndex, parameter.dataType);
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

  return {
    text: preparedText.replace(/\s+/g, ' ').trim(),
    values,
  };
}

function isPostgresCancellationError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const pgError = error as Error & { code?: string };
  return pgError.code === '57014' || /cancel/i.test(pgError.message);
}

@SqlProvider('Postgres')
class PostgresProvider extends BaseSqlProvider {
  readonly provider = 'Postgres' as const;

  async testConnection(connection: SqlConnection): Promise<void> {
    const client = new PgClient(buildPostgresConfig(connection, 5000));
    try {
      await client.connect();
      await client.query('SELECT 1 AS ping');
    } finally {
      await client.end();
    }
  }

  async executeQuery(
    context: SqlExecutionContext,
    connection: SqlConnection,
    queryText: string,
    sqlParameters: BoundSqlParameter[],
    boundParams: Record<string, unknown>
  ): Promise<QueryRows> {
    const prepared = preparePostgresQuery(queryText, sqlParameters, boundParams);
    const client = new PgClient(buildPostgresConfig(connection, 60000));

    try {
      await client.connect();
      context.throwIfCancelled();
      const result = await new Promise<PgQueryResult<Record<string, unknown>>>((resolve, reject) => {
        const query = client.query(prepared.text, prepared.values, (error, queryResult) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(queryResult as PgQueryResult<Record<string, unknown>>);
        });

        context.registerCancelHandler(() => {
          (
            client as PgClient & {
              cancel: (currentClient: PgClient, currentQuery: unknown) => void;
            }
          ).cancel(client, query);
        });
      });
      return (result.rows ?? []) as Array<Record<string, unknown>>;
    } catch (error) {
      if (context.cancelled || isPostgresCancellationError(error)) {
        throw context.createCancellationError();
      }
      throw error;
    } finally {
      await client.end();
    }
  }

  renderPreviewSql(
    queryText: string,
    sqlParameters: BoundSqlParameter[],
    boundParams: Record<string, unknown>
  ): string {
    return renderPreviewSqlWithNamedPlaceholders('Postgres', queryText, sqlParameters, boundParams);
  }
}

export default PostgresProvider;
