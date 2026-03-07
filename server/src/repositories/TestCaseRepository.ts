import { FILE_PATHS } from '../config/fileConstants';
import TestCase from '../models/TestCase';
import BaseRepository from './BaseRepository';

class TestCaseRepository extends BaseRepository<TestCase, ReturnType<TestCase['toJSON']>> {
  constructor() {
    super(FILE_PATHS.TEST_CASES, TestCase);
  }

  getByProfileId(profileId: string): TestCase[] {
    return this.where((testCase) => testCase.profileId === profileId);
  }

  getByProfileIdAndOrderIndex(profileId: string, orderIndex: number): TestCase | null {
    return this.single(
      (testCase) => testCase.profileId === profileId && testCase.orderIndex === orderIndex
    );
  }

  deleteByProfileId(profileId: string): number {
    return this.deleteWhere((testCase) => testCase.profileId === profileId);
  }
}

export default new TestCaseRepository();
