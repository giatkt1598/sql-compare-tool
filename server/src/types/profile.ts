export type SqlProvider = string;
export type SqlServerAuthType = 'WindowsAuth' | 'SqlServerAuth';

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
  [key: string]: unknown;
}

export interface ProfileData {
  id: string;
  name: string;
  description: string;
  oldSqlFilePath: string;
  newSqlFilePath: string;
  sqlProvider: SqlProvider;
  sqlConnection: SqlConnection;
  testCases: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export type CreateProfileInput = Omit<ProfileData, 'id' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<ProfileData, 'id' | 'createdAt' | 'updatedAt'>>;

export type UpdateProfileInput = Partial<Omit<ProfileData, 'id' | 'createdAt' | 'updatedAt'>>;
