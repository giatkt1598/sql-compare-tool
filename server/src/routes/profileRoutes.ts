import express from 'express';
import ProfileController from '../controllers/ProfileController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Profiles
 *     description: Profile management endpoints
 */

/**
 * @swagger
 * /api/profiles/statistics:
 *   get:
 *     summary: Get profile statistics
 *     description: Returns aggregated statistics for all stored profiles.
 *     tags:
 *       - Profiles
 *     responses:
 *       200:
 *         description: Profile statistics returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileStatistics'
 */
router.get('/statistics', ProfileController.getStatistics.bind(ProfileController));

/**
 * @swagger
 * /api/profiles/provider/{provider}:
 *   get:
 *     summary: Get profiles by SQL provider
 *     description: Returns all profiles that use the specified SQL provider.
 *     tags:
 *       - Profiles
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [SqlServer, Postgres, MySQL]
 *         description: SQL provider name
 *     responses:
 *       200:
 *         description: Matching profiles returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Invalid provider
 */
router.get('/provider/:provider', ProfileController.getByProvider.bind(ProfileController));

/**
 * @swagger
 * /api/profiles/search/{keyword}:
 *   get:
 *     summary: Search profiles
 *     description: Searches profiles by keyword.
 *     tags:
 *       - Profiles
 *     parameters:
 *       - in: path
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *         description: Search keyword
 *     responses:
 *       200:
 *         description: Matching profiles returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Search keyword is required
 */
router.get('/search/:keyword', ProfileController.searchProfiles.bind(ProfileController));

/**
 * @swagger
 * /api/profiles/recent:
 *   get:
 *     summary: Get recent profiles
 *     description: Returns the most recently created profiles using the default limit of 10.
 *     tags:
 *       - Profiles
 *     responses:
 *       200:
 *         description: Recent profiles returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 *
 * /api/profiles/recent/{limit}:
 *   get:
 *     summary: Get recent profiles with a custom limit
 *     description: Returns the most recently created profiles up to the requested limit.
 *     tags:
 *       - Profiles
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of profiles to return
 *     responses:
 *       200:
 *         description: Recent profiles returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Invalid limit
 */
router.get('/recent', ProfileController.getRecentProfiles.bind(ProfileController));
router.get('/recent/:limit', ProfileController.getRecentProfiles.bind(ProfileController));

/**
 * @swagger
 * /api/profiles:
 *   get:
 *     summary: Get all profiles
 *     description: Returns every profile stored in the system.
 *     tags:
 *       - Profiles
 *     responses:
 *       200:
 *         description: Profiles returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Profile'
 *       500:
 *         description: Unexpected server error
 */
router.get('/', ProfileController.getAllProfiles.bind(ProfileController));

/**
 * @swagger
 * /api/profiles:
 *   post:
 *     summary: Create a profile
 *     description: Creates a new profile with SQL provider and connection settings.
 *     tags:
 *       - Profiles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProfileRequest'
 *     responses:
 *       201:
 *         description: Profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Invalid request payload
 *       409:
 *         description: Profile already exists
 */
router.post('/', ProfileController.createProfile.bind(ProfileController));

/**
 * @swagger
 * /api/profiles/restore:
 *   post:
 *     summary: Restore a profile backup
 *     description: Uploads a backup ZIP file and restores the profile, dependent data, and stored results.
 *     tags:
 *       - Profiles
 *     requestBody:
 *       required: true
 *       content:
 *         application/zip:
 *           schema:
 *             type: string
 *             format: binary
 *         application/octet-stream:
 *           schema:
 *             type: string
 *             format: binary
 *     responses:
 *       200:
 *         description: Backup restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileRestoreResponse'
 *       400:
 *         description: Invalid backup file or restore failed
 */
router.post(
  '/restore',
  express.raw({
    type: () => true,
    limit: '200mb',
  }),
  ProfileController.restoreProfile.bind(ProfileController)
);

/**
 * @swagger
 * /api/profiles/{id}/backup:
 *   get:
 *     summary: Download a profile backup
 *     description: Downloads a ZIP archive containing the profile, related entities, and stored result files.
 *     tags:
 *       - Profiles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: Backup ZIP file returned successfully
 *         content:
 *           application/zip:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Profile not found
 */
router.get('/:id/backup', ProfileController.backupProfile.bind(ProfileController));

/**
 * @swagger
 * /api/profiles/{id}:
 *   get:
 *     summary: Get a profile by ID
 *     description: Returns a single profile by its ID.
 *     tags:
 *       - Profiles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: Profile returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       404:
 *         description: Profile not found
 */
router.get('/:id', ProfileController.getProfileById.bind(ProfileController));

/**
 * @swagger
 * /api/profiles/{id}:
 *   put:
 *     summary: Update a profile
 *     description: Updates an existing profile.
 *     tags:
 *       - Profiles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Invalid request payload
 *       404:
 *         description: Profile not found
 */
router.put('/:id', ProfileController.updateProfile.bind(ProfileController));

/**
 * @swagger
 * /api/profiles/{id}:
 *   delete:
 *     summary: Delete a profile
 *     description: Deletes a profile and its dependent data.
 *     tags:
 *       - Profiles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteEntityResponse'
 *       404:
 *         description: Profile not found
 */
router.delete('/:id', ProfileController.deleteProfile.bind(ProfileController));

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
 *           example: profile-1772797781825-jnbxsfpd2
 *         name:
 *           type: string
 *           description: Profile name
 *           example: Demo Postgres Profile
 *         description:
 *           type: string
 *           description: Optional profile description
 *           example: Compare old and new user access queries
 *         oldSqlFilePath:
 *           type: string
 *           description: Absolute path to the old SQL file
 *           example: C:\sql\old_query.sql
 *         newSqlFilePath:
 *           type: string
 *           description: Absolute path to the new SQL file
 *           example: C:\sql\new_query.sql
 *         oldSqlContent:
 *           type: string
 *           description: Inline SQL content for the old query. If provided, the server can use this instead of the file path.
 *         newSqlContent:
 *           type: string
 *           description: Inline SQL content for the new query. If provided, the server can use this instead of the file path.
 *         sqlProvider:
 *           type: string
 *           description: SQL database provider
 *           enum: [SqlServer, Postgres, MySQL]
 *           example: SqlServer
 *         sqlConnection:
 *           $ref: '#/components/schemas/ProfileSqlConnection'
 *         testCases:
 *           type: array
 *           description: List of test case IDs
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ProfileSqlConnection:
 *       type: object
 *       properties:
 *         host:
 *           type: string
 *           example: localhost
 *         port:
 *           type: integer
 *           example: 1433
 *         database:
 *           type: string
 *           example: master
 *         username:
 *           type: string
 *           example: sa
 *         password:
 *           type: string
 *           example: password
 *         authType:
 *           type: string
 *           enum: [WindowsAuth, SqlServerAuth]
 *         encrypt:
 *           type: boolean
 *           example: true
 *         trustServerCertificate:
 *           type: boolean
 *           example: true
 *         multipleActiveResultSets:
 *           type: boolean
 *           example: true
 *         sslMode:
 *           type: string
 *           enum: [disable, allow, prefer, require, verify-ca, verify-full]
 *
 *     CreateProfileRequest:
 *       type: object
 *       required:
 *         - name
 *         - sqlProvider
 *         - sqlConnection
 *       properties:
 *         name:
 *           type: string
 *           example: My Profile
 *         description:
 *           type: string
 *           example: Compare old and new queries
 *         oldSqlFilePath:
 *           type: string
 *           example: C:\sql\old_query.sql
 *         newSqlFilePath:
 *           type: string
 *           example: C:\sql\new_query.sql
 *         oldSqlContent:
 *           type: string
 *         newSqlContent:
 *           type: string
 *         sqlProvider:
 *           type: string
 *           enum: [SqlServer, Postgres, MySQL]
 *           example: SqlServer
 *         sqlConnection:
 *           $ref: '#/components/schemas/ProfileSqlConnection'
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
 *         oldSqlContent:
 *           type: string
 *         newSqlContent:
 *           type: string
 *         sqlProvider:
 *           type: string
 *           enum: [SqlServer, Postgres, MySQL]
 *         sqlConnection:
 *           $ref: '#/components/schemas/ProfileSqlConnection'
 *
 *     DeleteEntityResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Deleted successfully
 *         id:
 *           type: string
 *           example: profile-1772797781825-jnbxsfpd2
 *
 *     ProfileRestoreResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Profile restored successfully
 *         profileId:
 *           type: string
 *           example: profile-1772797781825-jnbxsfpd2
 *         restoredProfileName:
 *           type: string
 *           example: Demo Postgres Profile
 *         replacedExisting:
 *           type: boolean
 *           example: true
 *
 *     ProfileStatistics:
 *       type: object
 *       properties:
 *         totalProfiles:
 *           type: integer
 *           example: 4
 *         sqlServerCount:
 *           type: integer
 *           example: 1
 *         postgresCount:
 *           type: integer
 *           example: 2
 *         mySqlCount:
 *           type: integer
 *           example: 1
 *         usedProviders:
 *           type: array
 *           items:
 *             type: string
 *             example: Postgres
 */

export default router;
