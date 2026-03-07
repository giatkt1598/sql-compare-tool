import type { SqlConnection, SqlProvider } from '../../types/profile';
import type { SqlParameterData } from '../../types/sqlParameter';

export type QueryRow = Record<string, unknown>;
export type QueryRows = QueryRow[];
export type BoundSqlParameter = Pick<SqlParameterData, 'name' | 'index' | 'dataType'>;

export interface SqlExecutionContext {
  cancelled: boolean;
  throwIfCancelled: () => void;
  registerCancelHandler: (handler: () => void) => void;
  createCancellationError: () => Error;
}

export type SqlProviderConstructor = new () => BaseSqlProvider;

export abstract class BaseSqlProvider {
  abstract readonly provider: SqlProvider;

  abstract testConnection(connection: SqlConnection): Promise<void>;

  abstract executeQuery(
    context: SqlExecutionContext,
    connection: SqlConnection,
    queryText: string,
    sqlParameters: BoundSqlParameter[],
    boundParams: Record<string, unknown>
  ): Promise<QueryRows>;

  abstract renderPreviewSql(
    queryText: string,
    sqlParameters: BoundSqlParameter[],
    boundParams: Record<string, unknown>
  ): string;
}
