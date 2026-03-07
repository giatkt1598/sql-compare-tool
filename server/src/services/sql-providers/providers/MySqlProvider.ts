import { createConnection, type Connection } from 'mysql2/promise';
import type { SqlConnection } from '../../../types/profile';
import { SqlProvider } from '../registry';
import {
  BaseSqlProvider,
  type BoundSqlParameter,
  type QueryRows,
  type SqlExecutionContext,
} from '../types';
import { escapeRegex, parsePort, renderPreviewSqlWithNamedPlaceholders } from '../providerUtils';

function buildMySqlConfig(connection: SqlConnection) {
  return {
    host: String(connection.host ?? ''),
    port: parsePort(connection.port, 3306),
    database: String(connection.database ?? ''),
    user: String(connection.username ?? ''),
    password: String(connection.password ?? ''),
    connectTimeout: 5000,
    namedPlaceholders: false,
  };
}

function prepareMySqlQuery(
  queryText: string,
  sqlParameters: BoundSqlParameter[],
  boundParams: Record<string, unknown>
): { text: string; values: unknown[] } {
  let preparedText = queryText;
  const values: unknown[] = [];
  const sortedParameters = [...sqlParameters].sort((a, b) => a.index - b.index);

  for (const parameter of sortedParameters) {
    const escapedName = escapeRegex(parameter.name);
    const matches = [
      ...preparedText.matchAll(new RegExp(`@${escapedName}\\b`, 'g')),
      ...preparedText.matchAll(new RegExp(`:${escapedName}\\b`, 'g')),
      ...preparedText.matchAll(new RegExp(`\\{\\{\\s*${escapedName}\\s*\\}\\}`, 'g')),
    ];

    if (matches.length === 0) {
      continue;
    }

    preparedText = preparedText.replace(new RegExp(`@${escapedName}\\b`, 'g'), '?');
    preparedText = preparedText.replace(new RegExp(`:${escapedName}\\b`, 'g'), '?');
    preparedText = preparedText.replace(new RegExp(`\\{\\{\\s*${escapedName}\\s*\\}\\}`, 'g'), '?');

    for (let i = 0; i < matches.length; i += 1) {
      values.push(boundParams[parameter.name] ?? null);
    }
  }

  return { text: preparedText, values };
}

@SqlProvider('MySQL')
class MySqlProvider extends BaseSqlProvider {
  readonly provider = 'MySQL' as const;

  async testConnection(connection: SqlConnection): Promise<void> {
    const mysqlConnection: Connection = await createConnection(buildMySqlConfig(connection));
    try {
      await mysqlConnection.query('SELECT 1 AS ping');
    } finally {
      await mysqlConnection.end();
    }
  }

  async executeQuery(
    context: SqlExecutionContext,
    connection: SqlConnection,
    queryText: string,
    sqlParameters: BoundSqlParameter[],
    boundParams: Record<string, unknown>
  ): Promise<QueryRows> {
    const prepared = prepareMySqlQuery(queryText, sqlParameters, boundParams);
    const mysqlConnection: Connection = await createConnection(buildMySqlConfig(connection));
    try {
      context.throwIfCancelled();
      context.registerCancelHandler(() => {
        void mysqlConnection.destroy();
      });
      const [rows] = await mysqlConnection.query(prepared.text, prepared.values);
      return Array.isArray(rows) ? (rows as Array<Record<string, unknown>>) : [];
    } catch (error) {
      if (context.cancelled) {
        throw context.createCancellationError();
      }
      throw error;
    } finally {
      try {
        await mysqlConnection.end();
      } catch {
        // The connection may already be destroyed by cancellation.
      }
    }
  }

  renderPreviewSql(
    queryText: string,
    sqlParameters: BoundSqlParameter[],
    boundParams: Record<string, unknown>
  ): string {
    return renderPreviewSqlWithNamedPlaceholders(
      this.provider,
      queryText,
      sqlParameters,
      boundParams
    );
  }
}

export default MySqlProvider;
