import { getRegisteredSqlProviders, isRegisteredSqlProvider } from '../services/sql-providers';
import {
  type ValidationResult,
  type ProfileData,
  type CreateProfileInput,
} from '../types/profile';

class Profile implements ProfileData {
  id: string;
  name: string;
  description: string;
  oldSqlFilePath: string;
  newSqlFilePath: string;
  oldSqlContent?: string;
  newSqlContent?: string;
  sqlProvider: ProfileData['sqlProvider'];
  sqlConnection: ProfileData['sqlConnection'];
  testCases: string[];
  createdAt: string;
  updatedAt: string;

  constructor(data: Partial<CreateProfileInput> = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || '';
    this.description = data.description || '';
    this.oldSqlFilePath = data.oldSqlFilePath || '';
    this.newSqlFilePath = data.newSqlFilePath || '';
    this.oldSqlContent = data.oldSqlContent || '';
    this.newSqlContent = data.newSqlContent || '';
    this.sqlProvider = data.sqlProvider || 'SqlServer';
    this.sqlConnection = {
      host: data.sqlConnection?.host || '',
      port: data.sqlConnection?.port || '',
      database: data.sqlConnection?.database || '',
      username: data.sqlConnection?.username || '',
      password: data.sqlConnection?.password || '',
      ...data.sqlConnection,
    };
    this.testCases = Array.isArray(data.testCases) ? data.testCases : [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  private generateId(): string {
    return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  validate(): ValidationResult {
    const errors: string[] = [];
    const isSqlServerWindowsAuth =
      this.sqlProvider === 'SqlServer' && this.sqlConnection.authType === 'WindowsAuth';

    if (!this.name || this.name.trim() === '') {
      errors.push('Profile name is required');
    }

    if (
      (!this.oldSqlFilePath || this.oldSqlFilePath.trim() === '') &&
      (!this.oldSqlContent || this.oldSqlContent.trim() === '')
    ) {
      errors.push('Old SQL file path or inline SQL content is required');
    }

    if (
      (!this.newSqlFilePath || this.newSqlFilePath.trim() === '') &&
      (!this.newSqlContent || this.newSqlContent.trim() === '')
    ) {
      errors.push('New SQL file path or inline SQL content is required');
    }

    if (!this.sqlProvider || !isRegisteredSqlProvider(this.sqlProvider)) {
      errors.push(`SQL Provider must be one of: ${getRegisteredSqlProviders().join(', ')}`);
    }

    if (!this.sqlConnection.host || this.sqlConnection.host.trim() === '') {
      errors.push('Database host is required');
    }

    if (
      !isSqlServerWindowsAuth &&
      (!this.sqlConnection.username || this.sqlConnection.username.trim() === '')
    ) {
      errors.push('Database username is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toJSON(): ProfileData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      oldSqlFilePath: this.oldSqlFilePath,
      newSqlFilePath: this.newSqlFilePath,
      oldSqlContent: this.oldSqlContent,
      newSqlContent: this.newSqlContent,
      sqlProvider: this.sqlProvider,
      sqlConnection: this.sqlConnection,
      testCases: this.testCases,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export default Profile;
