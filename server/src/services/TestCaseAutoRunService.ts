import fs, { type FSWatcher } from 'node:fs';
import ProfileRepository from '../repositories/ProfileRepository';
import TestCaseRepository from '../repositories/TestCaseRepository';
import SqlService from './SqlService';

interface ManagedWatcher {
  testCaseId: string;
  profileId: string;
  watchedPaths: string[];
  signature: string;
  lastFingerprint: string;
  watchers: FSWatcher[];
  debounceTimer: NodeJS.Timeout | null;
  running: boolean;
  pending: boolean;
}

class TestCaseAutoRunService {
  private readonly watchers = new Map<string, ManagedWatcher>();

  syncAll(): void {
    const eligibleIds = new Set(
      TestCaseRepository.getAll()
        .filter((testCase) => testCase.autoRunWhenSqlChanges && testCase.enabled)
        .map((testCase) => testCase.id)
    );

    for (const watcher of this.watchers.values()) {
      if (!eligibleIds.has(watcher.testCaseId)) {
        this.removeTestCase(watcher.testCaseId);
      }
    }

    for (const testCaseId of eligibleIds) {
      this.syncTestCase(testCaseId);
    }
  }

  syncByProfileId(profileId: string): void {
    const testCases = TestCaseRepository.getByProfileId(profileId);
    const eligibleIds = new Set<string>();

    for (const testCase of testCases) {
      if (testCase.autoRunWhenSqlChanges && testCase.enabled) {
        eligibleIds.add(testCase.id);
        this.syncTestCase(testCase.id);
      }
    }

    for (const watcher of [...this.watchers.values()]) {
      if (watcher.profileId === profileId && !eligibleIds.has(watcher.testCaseId)) {
        this.removeTestCase(watcher.testCaseId);
      }
    }
  }

  syncTestCase(testCaseId: string): void {
    const testCase = TestCaseRepository.getById(testCaseId);
    if (!testCase || !testCase.autoRunWhenSqlChanges || !testCase.enabled) {
      this.removeTestCase(testCaseId);
      return;
    }

    const profile = ProfileRepository.getById(testCase.profileId);
    if (!profile) {
      this.removeTestCase(testCaseId);
      return;
    }

    const watchedPaths = [...new Set([profile.oldSqlFilePath, profile.newSqlFilePath])]
      .map((filePath) => filePath?.trim())
      .filter((filePath): filePath is string => Boolean(filePath))
      .map((filePath) => this.normalizePath(filePath));

    if (watchedPaths.length === 0 || watchedPaths.some((filePath) => !fs.existsSync(filePath))) {
      this.removeTestCase(testCaseId);
      return;
    }

    const signature = watchedPaths.join('||');
    const fingerprint = this.buildFingerprint(watchedPaths);
    const existing = this.watchers.get(testCaseId);

    if (existing && existing.signature === signature) {
      existing.profileId = profile.id;
      existing.lastFingerprint = fingerprint;
      return;
    }

    this.removeTestCase(testCaseId);

    const manager: ManagedWatcher = {
      testCaseId,
      profileId: profile.id,
      watchedPaths,
      signature,
      lastFingerprint: fingerprint,
      watchers: [],
      debounceTimer: null,
      running: false,
      pending: false,
    };

    manager.watchers = watchedPaths.map((filePath) =>
      fs.watch(filePath, () => {
        this.scheduleChangeEvaluation(manager);
      })
    );

    this.watchers.set(testCaseId, manager);
  }

  removeByProfileId(profileId: string): void {
    for (const watcher of [...this.watchers.values()]) {
      if (watcher.profileId === profileId) {
        this.removeTestCase(watcher.testCaseId);
      }
    }
  }

  removeTestCase(testCaseId: string): void {
    const watcher = this.watchers.get(testCaseId);
    if (!watcher) {
      return;
    }

    if (watcher.debounceTimer) {
      clearTimeout(watcher.debounceTimer);
    }

    for (const currentWatcher of watcher.watchers) {
      currentWatcher.close();
    }

    this.watchers.delete(testCaseId);
  }

  private scheduleChangeEvaluation(manager: ManagedWatcher): void {
    if (manager.debounceTimer) {
      clearTimeout(manager.debounceTimer);
    }

    manager.debounceTimer = setTimeout(() => {
      manager.debounceTimer = null;
      this.handlePotentialContentChange(manager);
    }, 500);
  }

  private handlePotentialContentChange(manager: ManagedWatcher): void {
    if (!this.watchers.has(manager.testCaseId)) {
      return;
    }

    const nextFingerprint = this.buildFingerprint(manager.watchedPaths);
    if (nextFingerprint === manager.lastFingerprint) {
      return;
    }

    manager.lastFingerprint = nextFingerprint;
    this.queueRun(manager);
  }

  private queueRun(manager: ManagedWatcher): void {
    if (manager.running) {
      manager.pending = true;
      SqlService.cancelRun(
        manager.testCaseId,
        'The previous SQL execution was cancelled because the SQL files changed. Re-running the latest SQL now.'
      );
      return;
    }

    manager.running = true;
    manager.pending = false;
    void this.run(manager);
  }

  private async run(manager: ManagedWatcher): Promise<void> {
    try {
      await SqlService.runTestCase(manager.testCaseId, undefined, { source: 'auto' });
    } catch {
      // SqlService already persists execution state and error output.
    } finally {
      manager.running = false;
      if (manager.pending) {
        manager.pending = false;
        this.queueRun(manager);
      }
    }
  }

  private buildFingerprint(filePaths: string[]): string {
    return filePaths
      .map((filePath) => {
        if (!fs.existsSync(filePath)) {
          return `${filePath}::__missing__`;
        }

        return `${filePath}::${fs.readFileSync(filePath, 'utf8')}`;
      })
      .join('||');
  }

  private normalizePath(filePath: string): string {
    return filePath.replace(/^["']|["']$/g, '');
  }
}

export default new TestCaseAutoRunService();
