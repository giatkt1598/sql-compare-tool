/**
 * Profile Routes
 * Định nghĩa tất cả các route cho Profile endpoints
 * 
 * IMPORTANT: Specific routes MUST come before generic routes
 * Example: /api/profiles/statistics BEFORE /api/profiles/:id
 */

const express = require('express');
const profileController = require('../controllers/ProfileController');

const router = express.Router();

// ===================== SPECIAL ROUTES (Must be before :id routes) =====================

/**
 * @swagger
 * /api/profiles/statistics:
 *   get:
 *     summary: Lấy thống kê profiles
 *     description: Get statistics about profiles
 *     tags:
 *       - Profiles - Special
 *     responses:
 *       200:
 *         description: Thống kê profiles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProfiles:
 *                       type: integer
 *                     sqlServerCount:
 *                       type: integer
 *                     postgresCount:
 *                       type: integer
 *                     usedProviders:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/statistics', profileController.getStatistics.bind(profileController));

/**
 * @swagger
 * /api/profiles/provider/{provider}:
 *   get:
 *     summary: Lấy profiles theo SQL provider
 *     description: Get all profiles for a specific SQL provider
 *     tags:
 *       - Profiles - Special
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - SqlServer
 *             - Postgres
 *         description: SQL provider type
 *     responses:
 *       200:
 *         description: Danh sách profiles được lấy thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Invalid provider
 */
router.get('/provider/:provider', profileController.getByProvider.bind(profileController));

/**
 * @swagger
 * /api/profiles/search/{keyword}:
 *   get:
 *     summary: Tìm kiếm profiles
 *     description: Search profiles by description keyword
 *     tags:
 *       - Profiles - Special
 *     parameters:
 *       - in: path
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *     responses:
 *       200:
 *         description: Danh sách profiles tìm thấy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Profile'
 */
router.get('/search/:keyword', profileController.searchProfiles.bind(profileController));

/**
 * @swagger
 * /api/profiles/recent/{limit}:
 *   get:
 *     summary: Lấy profiles gần đây
 *     description: Get recently created profiles
 *     tags:
 *       - Profiles - Special
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng profiles tối đa (1-100)
 *     responses:
 *       200:
 *         description: Danh sách profiles gần đây
 */
router.get('/recent/:limit?', profileController.getRecentProfiles.bind(profileController));

// ===================== STANDARD CRUD ROUTES =====================

/**
 * @swagger
 * /api/profiles:
 *   get:
 *     summary: Lấy danh sách tất cả profiles
 *     description: Retrieve all profiles stored in the system
 *     tags:
 *       - Profiles - CRUD
 *     responses:
 *       200:
 *         description: Danh sách profiles được lấy thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Profile'
 *                 message:
 *                   type: string
 *       500:
 *         description: Lỗi server
 */
router.get('/', profileController.getAllProfiles.bind(profileController));

/**
 * @swagger
 * /api/profiles:
 *   post:
 *     summary: Tạo profile mới
 *     description: Create a new profile with SQL provider and connection details
 *     tags:
 *       - Profiles - CRUD
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProfileRequest'
 *     responses:
 *       201:
 *         description: Profile được tạo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *       409:
 *         description: Profile name already exists
 */
router.post('/', profileController.createProfile.bind(profileController));

/**
 * @swagger
 * /api/profiles/{id}:
 *   get:
 *     summary: Lấy profile theo ID
 *     description: Retrieve a specific profile by its ID
 *     tags:
 *       - Profiles - CRUD
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của profile
 *     responses:
 *       200:
 *         description: Profile được lấy thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *                 message:
 *                   type: string
 *       404:
 *         description: Profile không tìm thấy
 */
router.get('/:id', profileController.getProfileById.bind(profileController));

/**
 * @swagger
 * /api/profiles/{id}:
 *   put:
 *     summary: Cập nhật profile
 *     description: Update an existing profile
 *     tags:
 *       - Profiles - CRUD
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile được cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *                 message:
 *                   type: string
 *       404:
 *         description: Profile không tìm thấy
 */
router.put('/:id', profileController.updateProfile.bind(profileController));

/**
 * @swagger
 * /api/profiles/{id}:
 *   delete:
 *     summary: Xóa profile
 *     description: Delete a profile by its ID
 *     tags:
 *       - Profiles - CRUD
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của profile
 *     responses:
 *       200:
 *         description: Profile được xóa thành công
 *       404:
 *         description: Profile không tìm thấy
 */
router.delete('/:id', profileController.deleteProfile.bind(profileController));

/**
 * @swagger
 * /api/profiles/{id}/test-connection:
 *   post:
 *     summary: Kiểm tra kết nối database
 *     description: Test the database connection for a specific profile
 *     tags:
 *       - Profiles - CRUD
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của profile
 *     responses:
 *       200:
 *         description: Connection test completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Connection failed
 */
router.post('/:id/test-connection', profileController.testConnection.bind(profileController));

// ===================== SWAGGER SCHEMAS =====================

/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique profile ID
 *           example: "profile-1772797781825-jnbxsfpd2"
 *         name:
 *           type: string
 *           description: Profile name
 *           example: "Test Profile 1"
 *         description:
 *           type: string
 *           description: Profile description
 *           example: "Test profile description"
 *         oldSqlFilePath:
 *           type: string
 *           description: Path to the old SQL file
 *           example: "C:\\sql\\old_query.sql"
 *         newSqlFilePath:
 *           type: string
 *           description: Path to the new SQL file
 *           example: "C:\\sql\\new_query.sql"
 *         sqlProvider:
 *           type: string
 *           description: SQL database provider
 *           enum:
 *             - SqlServer
 *             - Postgres
 *           example: "SqlServer"
 *         sqlConnection:
 *           type: object
 *           properties:
 *             host:
 *               type: string
 *               example: "localhost"
 *             port:
 *               type: integer
 *               example: 1433
 *             database:
 *               type: string
 *               example: "TestDB"
 *             username:
 *               type: string
 *               example: "sa"
 *             password:
 *               type: string
 *               example: "password"
 *         testCases:
 *           type: array
 *           description: List of test case IDs
 *           example: []
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-03-06T11:49:41.825Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-03-06T11:49:41.825Z"
 *
 *     CreateProfileRequest:
 *       type: object
 *       required:
 *         - name
 *         - oldSqlFilePath
 *         - newSqlFilePath
 *         - sqlProvider
 *         - sqlConnection
 *       properties:
 *         name:
 *           type: string
 *           example: "My Profile"
 *         description:
 *           type: string
 *           example: "Compare old and new queries"
 *         oldSqlFilePath:
 *           type: string
 *           example: "C:\\sql\\old_query.sql"
 *         newSqlFilePath:
 *           type: string
 *           example: "C:\\sql\\new_query.sql"
 *         sqlProvider:
 *           type: string
 *           enum:
 *             - SqlServer
 *             - Postgres
 *           example: "SqlServer"
 *         sqlConnection:
 *           type: object
 *           required:
 *             - host
 *             - username
 *           properties:
 *             host:
 *               type: string
 *               example: "localhost"
 *             port:
 *               type: integer
 *               example: 1433
 *             database:
 *               type: string
 *               example: "TestDB"
 *             username:
 *               type: string
 *               example: "sa"
 *             password:
 *               type: string
 *               example: "password"
 *
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         oldSqlFilePath:
 *           type: string
 *         newSqlFilePath:
 *           type: string
 *         sqlProvider:
 *           type: string
 *           enum:
 *             - SqlServer
 *             - Postgres
 *         sqlConnection:
 *           type: object
 *           properties:
 *             host:
 *               type: string
 *             port:
 *               type: integer
 *             database:
 *               type: string
 *             username:
 *               type: string
 *             password:
 *               type: string
 */

module.exports = router;
