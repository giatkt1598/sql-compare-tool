import fs from 'node:fs';
import path from 'node:path';
import { FILE_PATHS } from '../config/fileConstants';
import ProfileRepository from '../repositories/ProfileRepository';
import TestCaseRepository from '../repositories/TestCaseRepository';
import TestCaseAutoRunService from './TestCaseAutoRunService';
import type { CreateTestCaseInput, UpdateTestCaseInput } from '../types/testCase';
import type TestCase from '../models/TestCase';

interface LatestResultSummary {
  executionTime: string;
  parallelExecution?: boolean;
  oldSqlDuration?: number | null;
  newSqlDuration?: number | null;
  compareDuration?: number | null;
  error?: string;
  oldCount?: number;
  newCount?: number;
  differenceCount?: number;
  onlyInOldCount?: number;
  onlyInNewCount?: number;
  changedCount?: number;
  matched?: boolean;
}

class TestCaseService {
  getAll() {
    return TestCaseRepository.getAll().map((testCase) => this.enrichWithLatestResultSummary(testCase));
  }

  getById(id: string) {
    const testCase = TestCaseRepository.getById(id);
    if (!testCase) {
      throw new Error(`TestCase with ID ${id} not found`);
    }
    return this.enrichWithLatestResultSummary(testCase);
  }

  getByProfileId(profileId: string) {
    return TestCaseRepository.getByProfileId(profileId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((testCase) => this.enrichWithLatestResultSummary(testCase));
  }

  create(data: CreateTestCaseInput) {
    const profile = ProfileRepository.getById(data.profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${data.profileId} not found`);
    }

    const duplicated = TestCaseRepository.getByProfileIdAndOrderIndex(
      data.profileId,
      data.orderIndex
    );
    if (duplicated) {
      throw new Error(
        `TestCase orderIndex ${data.orderIndex} already exists for profile ${data.profileId}`
      );
    }

    const created = TestCaseRepository.add(data);
    TestCaseAutoRunService.syncTestCase(created.id);
    return this.enrichWithLatestResultSummary(created);
  }

  update(id: string, data: UpdateTestCaseInput) {
    const existing = TestCaseRepository.getById(id);
    if (!existing) {
      throw new Error(`TestCase with ID ${id} not found`);
    }

    const nextProfileId = data.profileId ?? existing.profileId;
    const nextOrderIndex = data.orderIndex ?? existing.orderIndex;

    const profile = ProfileRepository.getById(nextProfileId);
    if (!profile) {
      throw new Error(`Profile with ID ${nextProfileId} not found`);
    }

    const duplicated = TestCaseRepository.getByProfileIdAndOrderIndex(
      nextProfileId,
      nextOrderIndex
    );
    if (duplicated && duplicated.id !== id) {
      throw new Error(
        `TestCase orderIndex ${nextOrderIndex} already exists for profile ${nextProfileId}`
      );
    }

    const updated = TestCaseRepository.update(id, data);
    TestCaseAutoRunService.syncTestCase(updated.id);
    if (existing.profileId !== updated.profileId) {
      TestCaseAutoRunService.syncByProfileId(existing.profileId);
    }
    return this.enrichWithLatestResultSummary(updated);
  }

  delete(id: string) {
    const existing = TestCaseRepository.getById(id);
    if (!existing) {
      throw new Error(`TestCase with ID ${id} not found`);
    }

    const profile = ProfileRepository.getById(existing.profileId);
    if (profile) {
      const testCaseResultsDir = path.join(FILE_PATHS.RESULTS, profile.id, existing.id);
      if (fs.existsSync(testCaseResultsDir)) {
        fs.rmSync(testCaseResultsDir, { recursive: true, force: true });
      }
    }

    TestCaseAutoRunService.removeTestCase(id);
    TestCaseRepository.delete(id);
    return { message: 'TestCase deleted successfully', id };
  }

  previewImport(profileId: string, names: string[]) {
    const profile = ProfileRepository.getById(profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${profileId} not found`);
    }

    const existing = TestCaseRepository.getByProfileId(profileId);
    const normalizedNames = names
      .map((name) => String(name ?? '').trim())
      .filter((name) => name.length > 0);
    const existingNames = normalizedNames.filter((name) =>
      existing.some((testCase) => testCase.name === name)
    );

    return { existingNames };
  }

  importFromExcel(
    profileId: string,
    rows: Array<{
      name?: string;
      compareInOrder?: boolean;
      parallelExecution?: boolean;
      enabled?: boolean;
      expectedExecutionDuration?: number | null;
      parameter?: Record<string, unknown>;
    }>
  ) {
    const profile = ProfileRepository.getById(profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${profileId} not found`);
    }

    const existing = TestCaseRepository.getByProfileId(profileId);
    const existingByName = new Map(existing.map((item) => [item.name, item]));
    let nextOrderIndex = 0;
    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const name = String(row.name ?? '').trim();
      if (!name) {
        continue;
      }

      const parameterJson = JSON.stringify(row.parameter ?? {}, null, 2);
      const basePayload = {
        profileId,
        orderIndex: nextOrderIndex,
        name,
        parameter: parameterJson,
        compareInOrder: row.compareInOrder ?? false,
        parallelExecution: row.parallelExecution ?? true,
        expectedExecutionDuration:
          row.expectedExecutionDuration === undefined ? null : row.expectedExecutionDuration,
        enabled: row.enabled ?? true,
        executionCount: 0,
        status: null,
        error: null,
        executionDuration: null,
        executionTime: null,
      };

      const existingTestCase = existingByName.get(name);
      if (existingTestCase) {
        TestCaseRepository.update(existingTestCase.id, {
          ...basePayload,
          autoRunWhenSqlChanges: existingTestCase.autoRunWhenSqlChanges,
        });
        updated += 1;

        const testCaseResultsDir = path.join(FILE_PATHS.RESULTS, profileId, existingTestCase.id);
        if (fs.existsSync(testCaseResultsDir)) {
          fs.rmSync(testCaseResultsDir, { recursive: true, force: true });
        }
      } else {
        TestCaseRepository.add({
          ...basePayload,
          autoRunWhenSqlChanges: false,
        });
        created += 1;
      }

      nextOrderIndex += 1;
    }

    TestCaseAutoRunService.syncByProfileId(profileId);
    return { created, updated };
  }

  private enrichWithLatestResultSummary(testCase: TestCase) {
    const latestResultSummary = this.getLatestResultSummary(
      testCase.profileId,
      testCase.id,
      testCase.executionCount
    );

    return {
      ...testCase.toJSON(),
      latestResultSummary,
    };
  }

  private getLatestResultSummary(
    profileId: string,
    testCaseId: string,
    executionCount: number
  ): LatestResultSummary | null {
    if (executionCount <= 0) {
      return null;
    }

    const formattedExecutionCount = String(executionCount).padStart(4, '0');
    const summaryResultPath = path.join(
      FILE_PATHS.RESULTS,
      profileId,
      testCaseId,
      `${testCaseId}-${formattedExecutionCount}`,
      'summary-result.json'
    );

    if (!fs.existsSync(summaryResultPath)) {
      return null;
    }

    try {
      const rawContent = fs.readFileSync(summaryResultPath, 'utf8');
      if (!rawContent.trim()) {
        return null;
      }

      return JSON.parse(rawContent) as LatestResultSummary;
    } catch {
      return null;
    }
  }
}

export default new TestCaseService();
