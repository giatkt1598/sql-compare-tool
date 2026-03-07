export type SqlProvider = 'SqlServer' | 'Postgres' | 'MySQL';
export type SqlServerAuthType = 'WindowsAuth' | 'SqlServerAuth';
export type PostgresSslMode =
  | 'disable'
  | 'allow'
  | 'prefer'
  | 'require'
  | 'verify-ca'
  | 'verify-full';

export interface SqlConnection {
  host: string;
  port: number | string;
  database: string;
  username: string;
  password: string;
  authType?: SqlServerAuthType;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
  multipleActiveResultSets?: boolean;
  sslMode?: PostgresSslMode;
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  oldSqlFilePath: string;
  newSqlFilePath: string;
  oldSqlContent?: string;
  newSqlContent?: string;
  sqlProvider: SqlProvider;
  sqlConnection: SqlConnection;
  testCases: string[];
  createdAt: string;
  updatedAt: string;
}

export type ProviderConnections = Partial<Record<SqlProvider, SqlConnection>>;

export type ProfileFormInput = Omit<Profile, 'id' | 'createdAt' | 'updatedAt'> & {
  providerConnections: ProviderConnections;
};
