import express from 'express';
import ProfileController from '../controllers/ProfileController';

const router = express.Router();

// ===================== SPECIAL ROUTES (Must be before :id routes) =====================

/**
 * @swagger
 * /api/profiles/statistics:
 *   get:
 *     summary: Lay thong ke profiles
 *     description: Get statistics about profiles
 *     tags:
 *       - Profiles - Special
 *     responses:
 *       200:
 *         description: Thong ke profiles
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
router.get('/statistics', ProfileController.getStatistics.bind(ProfileController));

/**
 * @swagger
 * /api/profiles/provider/{provider}:
 *   get:
 *     summary: Lay profiles theo SQL provider
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
 *         description: Danh sach profiles duoc lay thanh cong
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
router.get('/provider/:provider', ProfileController.getByProvider.bind(ProfileController));

/**
 * @swagger
 * /api/profiles/search/{keyword}:
 *   get:
 *     summary: Tim kiem profiles
 *     description: Search profiles by description keyword
 *     tags:
 *       - Profiles - Special
 *     parameters:
 *       - in: path
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: Tu khoa tim kiem
 *     responses:
 *       200:
 *         description: Danh sach profiles tim thay
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
router.get('/search/:keyword', ProfileController.searchProfiles.bind(ProfileController));

/**
 * @swagger
 * /api/profiles/recent/{limit}:
 *   get:
 *     summary: Lay profiles gan day
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
 *         description: So luong profiles toi da (1-100)
 *     responses:
 *       200:
 *         description: Danh sach profiles gan day
 */
router.get('/recent', ProfileController.getRecentProfiles.bind(ProfileController));
router.get('/recent/:limit', ProfileController.getRecentProfiles.bind(ProfileController));

// ===================== STANDARD CRUD ROUTES =====================

/**
 * @swagger
 * /api/profiles:
 *   get:
 *     summary: Lay danh sach tat ca profiles
 *     description: Retrieve all profiles stored in the system
 *     tags:
 *       - Profiles - CRUD
 *     responses:
 *       200:
 *         description: Danh sach profiles duoc lay thanh cong
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
 *         description: Loi server
 */
router.get('/', ProfileController.getAllProfiles.bind(ProfileController));

/**
 * @swagger
 * /api/profiles:
 *   post:
 *     summary: Tao profile moi
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
 *         description: Profile duoc tao thanh cong
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
router.post('/', ProfileController.createProfile.bind(ProfileController));

/**
 * @swagger
 * /api/profiles/{id}:
 *   get:
 *     summary: Lay profile theo ID
 *     description: Retrieve a specific profile by its ID
 *     tags:
 *       - Profiles - CRUD
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cua profile
 *     responses:
 *       200:
 *         description: Profile duoc lay thanh cong
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
 *         description: Profile khong tim thay
 */
router.get('/:id', ProfileController.getProfileById.bind(ProfileController));

/**
 * @swagger
 * /api/profiles/{id}:
 *   put:
 *     summary: Cap nhat profile
 *     description: Update an existing profile
 *     tags:
 *       - Profiles - CRUD
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cua profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile duoc cap nhat thanh cong
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
 *         description: Profile khong tim thay
 */
router.put('/:id', ProfileController.updateProfile.bind(ProfileController));

/**
 * @swagger
 * /api/profiles/{id}:
 *   delete:
 *     summary: Xoa profile
 *     description: Delete a profile by its ID
 *     tags:
 *       - Profiles - CRUD
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID cua profile
 *     responses:
 *       200:
 *         description: Profile duoc xoa thanh cong
 *       404:
 *         description: Profile khong tim thay
 */
router.delete('/:id', ProfileController.deleteProfile.bind(ProfileController));

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

export default router;
