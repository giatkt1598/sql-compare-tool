import fs from 'node:fs';
import path from 'node:path';
import { FILE_PATHS } from '../config/fileConstants';
import ProfileRepository from '../repositories/ProfileRepository';
import SqlParameterRepository from '../repositories/SqlParameterRepository';
import TestCaseRepository from '../repositories/TestCaseRepository';
import TestCaseAutoRunService from './TestCaseAutoRunService';
import type { CreateProfileInput, SqlProvider, UpdateProfileInput } from '../types/profile';

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
}

export default new ProfileService();
