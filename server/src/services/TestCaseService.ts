import ProfileRepository from '../repositories/ProfileRepository';
import TestCaseRepository from '../repositories/TestCaseRepository';
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

    return TestCaseRepository.add(data);
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

    return TestCaseRepository.update(id, data);
  }

  delete(id: string) {
    TestCaseRepository.delete(id);
    return { message: 'TestCase deleted successfully', id };
  }
}

export default new TestCaseService();
