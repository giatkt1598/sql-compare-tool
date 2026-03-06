export type SqlProvider = 'SqlServer' | 'Postgres'
export type SqlServerAuthType = 'WindowsAuth' | 'SqlServerAuth'
export type PostgresSslMode =
  | 'disable'
  | 'allow'
  | 'prefer'
  | 'require'
  | 'verify-ca'
  | 'verify-full'

export interface SqlConnection {
  host: string
  port: number | string
  database: string
  username: string
  password: string
  authType?: SqlServerAuthType
  encrypt?: boolean
  trustServerCertificate?: boolean
  sslMode?: PostgresSslMode
}

export interface Profile {
  id: string
  name: string
  description: string
  oldSqlFilePath: string
  newSqlFilePath: string
  sqlProvider: SqlProvider
  sqlConnection: SqlConnection
  testCases: string[]
  createdAt: string
  updatedAt: string
}

export type ProfileFormInput = Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>

export const defaultSqlServerConnection: SqlConnection = {
  host: 'localhost',
  port: 1433,
  database: '',
  username: 'sa',
  password: '',
  authType: 'SqlServerAuth',
  encrypt: true,
  trustServerCertificate: true,
}

export const defaultPostgresConnection: SqlConnection = {
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  username: 'postgres',
  password: '',
  sslMode: 'prefer',
}

export function getDefaultConnection(provider: SqlProvider): SqlConnection {
  if (provider === 'SqlServer') {
    return { ...defaultSqlServerConnection }
  }

  return { ...defaultPostgresConnection }
}

export const defaultProfileFormInput: ProfileFormInput = {
  name: '',
  description: '',
  oldSqlFilePath: '',
  newSqlFilePath: '',
  sqlProvider: 'SqlServer',
  sqlConnection: getDefaultConnection('SqlServer'),
  testCases: [],
}

export function toProfileFormInput(profile: Profile): ProfileFormInput {
  const fallbackConnection = getDefaultConnection(profile.sqlProvider)

  return {
    name: profile.name,
    description: profile.description,
    oldSqlFilePath: profile.oldSqlFilePath,
    newSqlFilePath: profile.newSqlFilePath,
    sqlProvider: profile.sqlProvider,
    sqlConnection: {
      ...fallbackConnection,
      ...profile.sqlConnection,
    },
    testCases: profile.testCases,
  }
}
