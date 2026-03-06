import type { ValidationResult } from '../types/profile';
import {
  SQL_PARAMETER_DATA_TYPES,
  type CreateSqlParameterInput,
  type SqlParameterData,
} from '../types/sqlParameter';

class SqlParameter implements SqlParameterData {
  id: string;
  profileId: string;
  index: number;
  name: string;
  dataType: SqlParameterData['dataType'];
  createdAt: string;
  updatedAt: string;

  constructor(data: Partial<CreateSqlParameterInput> = {}) {
    this.id = data.id || this.generateId();
    this.profileId = data.profileId || '';
    this.index = Number.isFinite(Number(data.index)) ? Number(data.index) : 0;
    this.name = data.name || '';
    this.dataType = data.dataType || 'string';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  private generateId(): string {
    return `sqlparam-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  validate(): ValidationResult {
    const errors: string[] = [];

    if (!this.profileId || this.profileId.trim() === '') {
      errors.push('profileId is required');
    }

    if (!Number.isInteger(this.index) || this.index < 0) {
      errors.push('index must be an integer and greater than or equal to 0');
    }

    if (!this.name || this.name.trim() === '') {
      errors.push('Parameter name is required');
    }

    if (!SQL_PARAMETER_DATA_TYPES.includes(this.dataType)) {
      errors.push(`dataType must be one of: ${SQL_PARAMETER_DATA_TYPES.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toJSON(): SqlParameterData {
    return {
      id: this.id,
      profileId: this.profileId,
      index: this.index,
      name: this.name,
      dataType: this.dataType,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export default SqlParameter;
