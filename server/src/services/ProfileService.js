/**
 * Profile Service
 * Xử lý business logic cho Profile
 * Tác dụng như một layer giữa Controller và Repository
 */

const profileRepository = require('../repositories/ProfileRepository');
const Profile = require('../models/Profile');

class ProfileService {
    /**
     * Lấy danh sách tất cả profiles
     */
    getAllProfiles() {
        try {
            return profileRepository.getAll();
        } catch (error) {
            throw new Error(`Failed to get profiles: ${error.message}`);
        }
    }

    /**
     * Lấy profile theo ID
     */
    getProfileById(id) {
        try {
            const profile = profileRepository.getById(id);
            if (!profile) {
                throw new Error(`Profile with ID ${id} not found`);
            }
            return profile;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Tạo profile mới
     */
    createProfile(profileData) {
        try {
            // Kiểm tra xem profile với tên này đã tồn tại chưa
            if (profileRepository.isNameExists(profileData.name)) {
                throw new Error(`Profile with name "${profileData.name}" already exists`);
            }

            // Tạo profile mới
            const newProfile = profileRepository.add(profileData);
            return newProfile;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Cập nhật profile
     */
    updateProfile(id, profileData) {
        try {
            const existingProfile = profileRepository.getById(id);
            if (!existingProfile) {
                throw new Error(`Profile with ID ${id} not found`);
            }

            // Nếu thay đổi name, kiểm tra xem name mới có bị duplicate không
            if (profileData.name && profileData.name !== existingProfile.name) {
                if (profileRepository.isNameExists(profileData.name)) {
                    throw new Error(`Profile with name "${profileData.name}" already exists`);
                }
            }

            const updatedProfile = profileRepository.update(id, profileData);
            return updatedProfile;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Xóa profile
     */
    deleteProfile(id) {
        try {
            const existingProfile = profileRepository.getById(id);
            if (!existingProfile) {
                throw new Error(`Profile with ID ${id} not found`);
            }

            profileRepository.delete(id);
            return { message: 'Profile deleted successfully', id };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Kiểm tra kết nối database (giả lập)
     * TODO: Implement kiểm tra kết nối thực tế với database
     */
    async testConnection(sqlProvider, connectionString) {
        try {
            // TODO: Implement logic để test kết nối database
            // Hiện tại chỉ trả về success
            return {
                success: true,
                message: `Connection to ${sqlProvider} successful`,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Connection test failed: ${error.message}`);
        }
    }

    /**
     * Lấy profiles theo provider
     */
    getProfilesByProvider(provider) {
        try {
            return profileRepository.getByProvider(provider);
        } catch (error) {
            throw new Error(`Failed to get profiles by provider: ${error.message}`);
        }
    }

    /**
     * Tìm kiếm profiles
     */
    searchProfiles(keyword) {
        try {
            return profileRepository.searchByDescription(keyword);
        } catch (error) {
            throw new Error(`Failed to search profiles: ${error.message}`);
        }
    }

    /**
     * Lấy profiles gần đây
     */
    getRecentProfiles(limit = 10) {
        try {
            return profileRepository.getRecentProfiles(limit);
        } catch (error) {
            throw new Error(`Failed to get recent profiles: ${error.message}`);
        }
    }

    /**
     * Lấy thông tin thống kê
     */
    getStatistics() {
        try {
            return {
                totalProfiles: profileRepository.count(),
                sqlServerCount: profileRepository.countByProvider('SqlServer'),
                postgresCount: profileRepository.countByProvider('Postgres'),
                usedProviders: profileRepository.getUsedProviders()
            };
        } catch (error) {
            throw new Error(`Failed to get statistics: ${error.message}`);
        }
    }
}

module.exports = new ProfileService();
