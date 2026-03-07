import type { ValidationResult } from '../types/profile';
import {
  TEST_CASE_EXECUTION_RESULTS,
  type CreateTestCaseInput,
  type TestCaseData,
} from '../types/testCase';

class TestCase implements TestCaseData {
  id: string;
  profileId: string;
  orderIndex: number;
  name: string;
  parameter: string;
  executionCount: number;
  executionResult: TestCaseData['executionResult'];
  executionDuration: number | null;
  executionTime: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;

  constructor(data: Partial<CreateTestCaseInput> = {}) {
    this.id = data.id || this.generateId();
    this.profileId = data.profileId || '';
    this.orderIndex = Number.isFinite(Number(data.orderIndex)) ? Number(data.orderIndex) : 0;
    this.name = data.name || '';
    this.parameter = data.parameter || '';
    this.executionCount = Number.isFinite(Number(data.executionCount))
      ? Number(data.executionCount)
      : 0;
    this.executionResult = data.executionResult ?? null;
    this.executionDuration =
      data.executionDuration === null
        ? null
        : data.executionDuration === undefined
          ? null
          : Number(data.executionDuration);
    this.executionTime = data.executionTime ?? null;
    this.enabled = typeof data.enabled === 'boolean' ? data.enabled : true;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  private generateId(): string {
    return `testcase-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  validate(): ValidationResult {
    const errors: string[] = [];

    if (!this.profileId || this.profileId.trim() === '') {
      errors.push('profileId is required');
    }

    if (!Number.isInteger(this.orderIndex) || this.orderIndex < 0) {
      errors.push('orderIndex must be an integer and greater than or equal to 0');
    }

    if (!this.name || this.name.trim() === '') {
      errors.push('name is required');
    }

    if (!Number.isInteger(this.executionCount) || this.executionCount < 0) {
      errors.push('executionCount must be an integer and greater than or equal to 0');
    }

    if (
      this.executionResult !== null &&
      !TEST_CASE_EXECUTION_RESULTS.includes(this.executionResult)
    ) {
      errors.push(`executionResult must be one of: ${TEST_CASE_EXECUTION_RESULTS.join(', ')}`);
    }

    if (
      this.executionDuration !== null &&
      (!Number.isFinite(this.executionDuration) || this.executionDuration < 0)
    ) {
      errors.push('executionDuration must be a number and greater than or equal to 0');
    }

    if (this.executionTime !== null && Number.isNaN(new Date(this.executionTime).getTime())) {
      errors.push('executionTime must be a valid ISO date string');
    }

    if (typeof this.enabled !== 'boolean') {
      errors.push('enabled must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  toJSON(): TestCaseData {
    return {
      id: this.id,
      profileId: this.profileId,
      orderIndex: this.orderIndex,
      name: this.name,
      parameter: this.parameter,
      executionCount: this.executionCount,
      executionResult: this.executionResult,
      executionDuration: this.executionDuration,
      executionTime: this.executionTime,
      enabled: this.enabled,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export default TestCase;
