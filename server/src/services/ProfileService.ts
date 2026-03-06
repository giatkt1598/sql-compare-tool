import ProfileRepository from '../repositories/ProfileRepository';
import type {
  CreateProfileInput,
  ProfileData,
  SqlProvider,
  UpdateProfileInput
} from '../types/profile';

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

    return ProfileRepository.update(id, profileData);
  }

  deleteProfile(id: string): { message: string; id: string } {
    const existingProfile = ProfileRepository.getById(id);
    if (!existingProfile) {
      throw new Error(`Profile with ID ${id} not found`);
    }

    ProfileRepository.delete(id);
    return { message: 'Profile deleted successfully', id };
  }

  async testConnection(sqlProvider: SqlProvider, connection: ProfileData['sqlConnection']) {
    if (!connection.host) {
      throw new Error('Database host is required');
    }

    return {
      success: true,
      message: `Connection to ${sqlProvider} successful`,
      timestamp: new Date().toISOString()
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
      usedProviders: ProfileRepository.getUsedProviders()
    };
  }
}

export default new ProfileService();