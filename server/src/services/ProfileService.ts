import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { FILE_PATHS } from '../config/fileConstants';
import ProfileRepository from '../repositories/ProfileRepository';
import SqlParameterRepository from '../repositories/SqlParameterRepository';
import TestCaseRepository from '../repositories/TestCaseRepository';
import TestCaseAutoRunService from './TestCaseAutoRunService';
import type {
  CreateProfileInput,
  ProfileData,
  SqlProvider,
  UpdateProfileInput,
} from '../types/profile';
import type { SqlParameterData } from '../types/sqlParameter';
import type { TestCaseData } from '../types/testCase';

interface ProfileBackupBundle {
  version: number;
  exportedAt: string;
  profile: ProfileData;
  sqlParameters: SqlParameterData[];
  testCases: TestCaseData[];
}

class ProfileService {
  getAllProfiles() {
    return ProfileRepository.getAll();
  }

  getProfileById(id: string) {
    const profile = ProfileRepository.getById(id);
    if (!profile) {
      throw new Error(`Profile with ID ${id} not found`);
    }
    return profile;
  }

  createProfile(profileData: CreateProfileInput) {
    if (ProfileRepository.isNameExists(profileData.name)) {
      throw new Error(`Profile with name "${profileData.name}" already exists`);
    }

    return ProfileRepository.add(profileData);
  }

  updateProfile(id: string, profileData: UpdateProfileInput) {
    const existingProfile = ProfileRepository.getById(id);
    if (!existingProfile) {
      throw new Error(`Profile with ID ${id} not found`);
    }

    if (profileData.name && profileData.name !== existingProfile.name) {
      if (ProfileRepository.isNameExists(profileData.name)) {
        throw new Error(`Profile with name "${profileData.name}" already exists`);
      }
    }

    const updated = ProfileRepository.update(id, profileData);
    TestCaseAutoRunService.syncByProfileId(id);
    return updated;
  }

  deleteProfile(id: string): { message: string; id: string } {
    const existingProfile = ProfileRepository.getById(id);
    if (!existingProfile) {
      throw new Error(`Profile with ID ${id} not found`);
    }

    TestCaseAutoRunService.removeByProfileId(id);
    SqlParameterRepository.deleteByProfileId(id);
    TestCaseRepository.deleteByProfileId(id);

    const profileResultsDir = path.join(FILE_PATHS.RESULTS, existingProfile.id);
    if (fs.existsSync(profileResultsDir)) {
      fs.rmSync(profileResultsDir, { recursive: true, force: true });
    }

    ProfileRepository.delete(id);
    return { message: 'Profile deleted successfully', id };
  }

  backupProfile(id: string): { fileName: string; buffer: Buffer } {
    const profile = ProfileRepository.getById(id);
    if (!profile) {
      throw new Error(`Profile with ID ${id} not found`);
    }

    const sqlParameters = SqlParameterRepository.getByProfileId(id).map((item) => item.toJSON());
    const testCases = TestCaseRepository.getByProfileId(id).map((item) => item.toJSON());
    const bundle: ProfileBackupBundle = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: profile.toJSON(),
      sqlParameters,
      testCases,
    };

    const zip = new AdmZip();
    zip.addFile('profile-backup.json', Buffer.from(JSON.stringify(bundle, null, 2), 'utf8'));

    const resultsDir = path.join(FILE_PATHS.RESULTS, profile.id);
    if (fs.existsSync(resultsDir)) {
      zip.addLocalFolder(resultsDir, 'results');
    }

    return {
      fileName: `${this.buildBackupFileName(profile.name)}.zip`,
      buffer: zip.toBuffer(),
    };
  }

  restoreProfileBackup(zipBuffer: Buffer): {
    message: string;
    profileId: string;
    restoredProfileName: string;
    replacedExisting: boolean;
  } {
    const zip = new AdmZip(zipBuffer);
    const bundleEntry = zip.getEntry('profile-backup.json');
    if (!bundleEntry) {
      throw new Error('profile-backup.json not found in backup file');
    }

    const bundle = JSON.parse(bundleEntry.getData().toString('utf8')) as ProfileBackupBundle;
    if (!bundle.profile?.id) {
      throw new Error('Backup file is missing profile data');
    }

    const replacedExisting = Boolean(ProfileRepository.getById(bundle.profile.id));
    if (replacedExisting) {
      this.deleteProfile(bundle.profile.id);
    }

    this.appendRawItem(FILE_PATHS.PROFILES, bundle.profile);
    this.appendRawItems(FILE_PATHS.SQL_PARAMETERS, bundle.sqlParameters);
    this.appendRawItems(FILE_PATHS.TEST_CASES, bundle.testCases);

    const resultsTargetDir = path.join(FILE_PATHS.RESULTS, bundle.profile.id);
    if (fs.existsSync(resultsTargetDir)) {
      fs.rmSync(resultsTargetDir, { recursive: true, force: true });
    }

    const resultEntries = zip
      .getEntries()
      .filter((entry) => entry.entryName.startsWith('results/') && !entry.isDirectory);

    if (resultEntries.length > 0) {
      fs.mkdirSync(resultsTargetDir, { recursive: true });
      for (const entry of resultEntries) {
        const relativePath = entry.entryName.replace(/^results\//, '');
        const destinationPath = path.join(resultsTargetDir, relativePath);
        fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
        fs.writeFileSync(destinationPath, entry.getData());
      }
    }

    TestCaseAutoRunService.syncByProfileId(bundle.profile.id);

    return {
      message: replacedExisting
        ? 'Profile restored and existing profile replaced successfully'
        : 'Profile restored successfully',
      profileId: bundle.profile.id,
      restoredProfileName: bundle.profile.name,
      replacedExisting,
    };
  }

  getProfilesByProvider(provider: SqlProvider) {
    return ProfileRepository.getByProvider(provider);
  }

  searchProfiles(keyword: string) {
    return ProfileRepository.searchByDescription(keyword);
  }

  getRecentProfiles(limit = 10) {
    return ProfileRepository.getRecentProfiles(limit);
  }

  getStatistics() {
    return {
      totalProfiles: ProfileRepository.count(),
      sqlServerCount: ProfileRepository.countByProvider('SqlServer'),
      postgresCount: ProfileRepository.countByProvider('Postgres'),
      usedProviders: ProfileRepository.getUsedProviders(),
    };
  }

  private appendRawItem<T>(filePath: string, item: T): void {
    this.appendRawItems(filePath, [item]);
  }

  private appendRawItems<T>(filePath: string, items: T[]): void {
    const existing = this.readJsonArray<T>(filePath);
    fs.writeFileSync(filePath, JSON.stringify([...existing, ...items], null, 2), 'utf8');
  }

  private readJsonArray<T>(filePath: string): T[] {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  }

  private sanitizeFileName(value: string): string {
    const sanitized = [...value]
      .map((character) => {
        const code = character.charCodeAt(0);
        if (code < 32 || ['<', '>', ':', '"', '/', '\\', '|', '?', '*'].includes(character)) {
          return '_';
        }
        return character;
      })
      .join('')
      .trim();

    return sanitized || 'profile-backup';
  }

  private buildBackupFileName(profileName: string): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:]/g, '-')
      .replace(/\.\d{3}Z$/, 'Z');

    return `${this.sanitizeFileName(profileName)}-backup-${timestamp}`;
  }
}

export default new ProfileService();
