/**
 * Profile Controller
 * Xử lý HTTP requests và responses cho Profile
 * Gọi Service để xử lý business logic
 */

const profileService = require('../services/ProfileService');

class ProfileController {
    /**
     * GET /api/profiles
     * Lấy danh sách tất cả profiles
     */
    getAllProfiles(req, res) {
        try {
            const profiles = profileService.getAllProfiles();
            res.status(200).json({
                success: true,
                data: profiles,
                message: 'Profiles retrieved successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * GET /api/profiles/:id
     * Lấy profile theo ID
     */
    getProfileById(req, res) {
        try {
            const { id } = req.params;
            const profile = profileService.getProfileById(id);
            res.status(200).json({
                success: true,
                data: profile,
                message: 'Profile retrieved successfully'
            });
        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * POST /api/profiles
     * Tạo profile mới
     */
    createProfile(req, res) {
        try {
            const profileData = req.body;

            // Validate required fields
            if (!profileData.name) {
                return res.status(400).json({
                    success: false,
                    message: 'Profile name is required'
                });
            }

            if (!profileData.sqlProvider || !['SqlServer', 'Postgres'].includes(profileData.sqlProvider)) {
                return res.status(400).json({
                    success: false,
                    message: 'SQL Provider must be either SqlServer or Postgres'
                });
            }

            if (!profileData.oldSqlFilePath) {
                return res.status(400).json({
                    success: false,
                    message: 'Old SQL file path is required'
                });
            }

            if (!profileData.newSqlFilePath) {
                return res.status(400).json({
                    success: false,
                    message: 'New SQL file path is required'
                });
            }

            if (!profileData.sqlConnection || !profileData.sqlConnection.host) {
                return res.status(400).json({
                    success: false,
                    message: 'Database connection details are required'
                });
            }

            const newProfile = profileService.createProfile(profileData);
            res.status(201).json({
                success: true,
                data: newProfile,
                message: 'Profile created successfully'
            });
        } catch (error) {
            const statusCode = error.message.includes('already exists') ? 409 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * PUT /api/profiles/:id
     * Cập nhật profile
     */
    updateProfile(req, res) {
        try {
            const { id } = req.params;
            const profileData = req.body;

            if (!profileData || Object.keys(profileData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No data to update'
                });
            }

            const updatedProfile = profileService.updateProfile(id, profileData);
            res.status(200).json({
                success: true,
                data: updatedProfile,
                message: 'Profile updated successfully'
            });
        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * DELETE /api/profiles/:id
     * Xóa profile
     */
    deleteProfile(req, res) {
        try {
            const { id } = req.params;
            const result = profileService.deleteProfile(id);
            res.status(200).json({
                success: true,
                data: result,
                message: 'Profile deleted successfully'
            });
        } catch (error) {
            const statusCode = error.message.includes('not found') ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * POST /api/profiles/:id/test-connection
     * Kiểm tra kết nối database
     */
    async testConnection(req, res) {
        try {
            const { id } = req.params;
            const profile = profileService.getProfileById(id);

            const result = await profileService.testConnection(
                profile.sqlProvider,
                profile.sqlConnection
            );

            res.status(200).json({
                success: true,
                data: result,
                message: 'Connection test completed'
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * GET /api/profiles/provider/:provider
     * Lấy profiles theo SQL provider
     */
    getByProvider(req, res) {
        try {
            const { provider } = req.params;

            if (!['SqlServer', 'Postgres'].includes(provider)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid provider. Must be SqlServer or Postgres'
                });
            }

            const profiles = profileService.getProfilesByProvider(provider);
            res.status(200).json({
                success: true,
                data: profiles,
                message: `Profiles for provider ${provider} retrieved successfully`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * GET /api/profiles/search/:keyword
     * Tìm kiếm profiles
     */
    searchProfiles(req, res) {
        try {
            const { keyword } = req.params;

            if (!keyword || keyword.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Search keyword is required'
                });
            }

            const profiles = profileService.searchProfiles(keyword);
            res.status(200).json({
                success: true,
                data: profiles,
                message: `Found ${profiles.length} profiles matching keyword`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * GET /api/profiles/recent/:limit
     * Lấy profiles gần đây
     */
    getRecentProfiles(req, res) {
        try {
            const limit = parseInt(req.params.limit) || 10;

            if (limit < 1 || limit > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Limit must be between 1 and 100'
                });
            }

            const profiles = profileService.getRecentProfiles(limit);
            res.status(200).json({
                success: true,
                data: profiles,
                message: `Retrieved ${profiles.length} recent profiles`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    /**
     * GET /api/profiles/statistics
     * Lấy thống kê profiles
     */
    getStatistics(req, res) {
        try {
            const stats = profileService.getStatistics();
            res.status(200).json({
                success: true,
                data: stats,
                message: 'Statistics retrieved successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new ProfileController();
