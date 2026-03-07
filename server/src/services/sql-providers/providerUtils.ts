import type { SqlProvider } from '../../types/profile';
import type { SqlParameterDataType } from '../../types/sqlParameter';
import type { BoundSqlParameter } from './types';

export function parsePort(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value ?? fallback), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

export function toSqlLiteral(
  value: unknown,
  dataType: SqlParameterDataType,
  sqlProvider: SqlProvider
): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (dataType === 'number') {
    return String(value);
  }

  if (dataType === 'boolean') {
    if (sqlProvider === 'SqlServer') {
      return value ? '1' : '0';
    }
    return value ? 'TRUE' : 'FALSE';
  }

  if (dataType === 'json') {
    const jsonText = typeof value === 'string' ? value : JSON.stringify(value);
    return `'${escapeSqlString(jsonText)}'`;
  }

  return `'${escapeSqlString(String(value))}'`;
}

export function renderPreviewSqlWithNamedPlaceholders(
  sqlProvider: SqlProvider,
  queryText: string,
  sqlParameters: BoundSqlParameter[],
  boundParams: Record<string, unknown>,
  transformSourceSql?: (queryText: string, sqlParameters: BoundSqlParameter[]) => string
): string {
  let previewText = transformSourceSql ? transformSourceSql(queryText, sqlParameters) : queryText;

  for (const parameter of [...sqlParameters].sort((a, b) => a.index - b.index)) {
    const escapedName = escapeRegex(parameter.name);
    const literal = toSqlLiteral(boundParams[parameter.name], parameter.dataType, sqlProvider);

    previewText = previewText.replace(new RegExp(`@${escapedName}\\b`, 'g'), literal);
    previewText = previewText.replace(new RegExp(`:${escapedName}\\b`, 'g'), literal);
    previewText = previewText.replace(
      new RegExp(`\\{\\{\\s*${escapedName}\\s*\\}\\}`, 'g'),
      literal
    );
  }

  return previewText;
}
