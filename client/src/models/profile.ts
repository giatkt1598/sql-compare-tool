export type SqlProvider = 'SqlServer' | 'Postgres'

export interface SqlConnection {
  host: string
  port: number | string
  database: string
  username: string
  password: string
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

export const defaultProfileFormInput: ProfileFormInput = {
  name: '',
  description: '',
  oldSqlFilePath: '',
  newSqlFilePath: '',
  sqlProvider: 'SqlServer',
  sqlConnection: {
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
  },
  testCases: [],
}

export function toProfileFormInput(profile: Profile): ProfileFormInput {
  return {
    name: profile.name,
    description: profile.description,
    oldSqlFilePath: profile.oldSqlFilePath,
    newSqlFilePath: profile.newSqlFilePath,
    sqlProvider: profile.sqlProvider,
    sqlConnection: {
      host: profile.sqlConnection.host,
      port: profile.sqlConnection.port,
      database: profile.sqlConnection.database,
      username: profile.sqlConnection.username,
      password: profile.sqlConnection.password,
    },
    testCases: profile.testCases,
  }
}
