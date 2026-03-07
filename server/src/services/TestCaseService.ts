import fs from 'node:fs';
import path from 'node:path';
import { FILE_PATHS } from '../config/fileConstants';
import ProfileRepository from '../repositories/ProfileRepository';
import TestCaseRepository from '../repositories/TestCaseRepository';
import TestCaseAutoRunService from './TestCaseAutoRunService';
import type { CreateTestCaseInput, UpdateTestCaseInput } from '../types/testCase';

class TestCaseService {
  getAll() {
    return TestCaseRepository.getAll();
  }

  getById(id: string) {
    const testCase = TestCaseRepository.getById(id);
    if (!testCase) {
      throw new Error(`TestCase with ID ${id} not found`);
    }
    return testCase;
  }

  getByProfileId(profileId: string) {
    return TestCaseRepository.getByProfileId(profileId).sort((a, b) => a.orderIndex - b.orderIndex);
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
    return created;
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
    return updated;
  }

  delete(id: string) {
    const existing = TestCaseRepository.getById(id);
    if (!existing) {
      throw new Error(`TestCase with ID ${id} not found`);
    }

    const profile = ProfileRepository.getById(existing.profileId);
    if (profile) {
      const testCaseResultsDir = path.join(
        FILE_PATHS.RESULTS,
        this.toSafePathSegment(profile.name),
        this.toSafePathSegment(existing.name)
      );
      if (fs.existsSync(testCaseResultsDir)) {
        fs.rmSync(testCaseResultsDir, { recursive: true, force: true });
      }
    }

    TestCaseAutoRunService.removeTestCase(id);
    TestCaseRepository.delete(id);
    return { message: 'TestCase deleted successfully', id };
  }

  private toSafePathSegment(value: string): string {
    const sanitized = value
      .trim()
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
      .replace(/\s+/g, ' ');
    return sanitized || 'unnamed';
  }
}

export default new TestCaseService();
