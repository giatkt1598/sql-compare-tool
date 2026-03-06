export const sqlParameterDataTypes = [
  'string',
  'number',
  'boolean',
  'date',
  'datetime',
  'json',
  'uuid',
] as const;

export type SqlParameterDataType = (typeof sqlParameterDataTypes)[number];

export interface SqlParameter {
  id: string;
  profileId: string;
  index: number;
  name: string;
  dataType: SqlParameterDataType;
  createdAt: string;
  updatedAt: string;
}

export type SqlParameterFormInput = Omit<
  SqlParameter,
  'id' | 'createdAt' | 'updatedAt' | 'profileId'
>;

export interface SqlParameterArrayItemInput {
  id?: string;
  index: number;
  name: string;
  dataType: SqlParameterDataType;
}

export const defaultSqlParameterFormInput: SqlParameterFormInput = {
  index: 0,
  name: 'param_1',
  dataType: 'string',
};
