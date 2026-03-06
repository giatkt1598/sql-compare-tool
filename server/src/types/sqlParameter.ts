export const SQL_PARAMETER_DATA_TYPES = [
  'string',
  'number',
  'boolean',
  'date',
  'datetime',
  'json',
  'uuid',
] as const;

export type SqlParameterDataType = (typeof SQL_PARAMETER_DATA_TYPES)[number];

export interface SqlParameterData {
  id: string;
  profileId: string;
  index: number;
  name: string;
  dataType: SqlParameterDataType;
  createdAt: string;
  updatedAt: string;
}

export type CreateSqlParameterInput = Omit<SqlParameterData, 'id' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<SqlParameterData, 'id' | 'createdAt' | 'updatedAt'>>;

export type UpdateSqlParameterInput = Partial<
  Omit<SqlParameterData, 'id' | 'createdAt' | 'updatedAt'>
>;

export interface SqlParameterArrayItemInput {
  id?: string;
  index: number;
  name: string;
  dataType: SqlParameterDataType;
}
