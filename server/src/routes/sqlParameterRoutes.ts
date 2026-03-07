import express from 'express';
import SqlParameterController from '../controllers/SqlParameterController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: SQL Parameters
 *     description: SQL parameter management endpoints
 */

/**
 * @swagger
 * /api/sql-parameters/profile/{profileId}:
 *   put:
 *     summary: Replace all SQL parameters for a profile
 *     description: Replaces every SQL parameter of a profile with the provided array.
 *     tags:
 *       - SQL Parameters
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/SqlParameterArrayItemInput'
 *     responses:
 *       200:
 *         description: SQL parameters replaced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SqlParameter'
 *       400:
 *         description: Invalid request payload
 *       404:
 *         description: Profile not found
 *
 *   get:
 *     summary: Get SQL parameters by profile ID
 *     description: Returns all SQL parameters assigned to the specified profile.
 *     tags:
 *       - SQL Parameters
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: SQL parameters returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SqlParameter'
 *       400:
 *         description: Invalid profile ID
 */
router.put(
  '/profile/:profileId',
  SqlParameterController.replaceByProfileId.bind(SqlParameterController)
);
router.get(
  '/profile/:profileId',
  SqlParameterController.getByProfileId.bind(SqlParameterController)
);

/**
 * @swagger
 * /api/sql-parameters:
 *   get:
 *     summary: Get all SQL parameters
 *     description: Returns all SQL parameters stored in the system.
 *     tags:
 *       - SQL Parameters
 *     responses:
 *       200:
 *         description: SQL parameters returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SqlParameter'
 *       500:
 *         description: Unexpected server error
 *
 *   post:
 *     summary: Create a SQL parameter
 *     description: Creates a new SQL parameter for a profile.
 *     tags:
 *       - SQL Parameters
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSqlParameterRequest'
 *     responses:
 *       201:
 *         description: SQL parameter created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SqlParameter'
 *       400:
 *         description: Invalid request payload
 *       404:
 *         description: Profile not found
 */
router.get('/', SqlParameterController.getAll.bind(SqlParameterController));
router.post('/', SqlParameterController.create.bind(SqlParameterController));

/**
 * @swagger
 * /api/sql-parameters/{id}:
 *   get:
 *     summary: Get a SQL parameter by ID
 *     description: Returns a single SQL parameter by its ID.
 *     tags:
 *       - SQL Parameters
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SQL parameter ID
 *     responses:
 *       200:
 *         description: SQL parameter returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SqlParameter'
 *       404:
 *         description: SQL parameter not found
 *
 *   put:
 *     summary: Update a SQL parameter
 *     description: Updates an existing SQL parameter.
 *     tags:
 *       - SQL Parameters
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SQL parameter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSqlParameterRequest'
 *     responses:
 *       200:
 *         description: SQL parameter updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SqlParameter'
 *       400:
 *         description: Invalid request payload
 *       404:
 *         description: SQL parameter not found
 *
 *   delete:
 *     summary: Delete a SQL parameter
 *     description: Deletes a SQL parameter by its ID.
 *     tags:
 *       - SQL Parameters
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SQL parameter ID
 *     responses:
 *       200:
 *         description: SQL parameter deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteEntityResponse'
 *       404:
 *         description: SQL parameter not found
 */
router.get('/:id', SqlParameterController.getById.bind(SqlParameterController));
router.put('/:id', SqlParameterController.update.bind(SqlParameterController));
router.delete('/:id', SqlParameterController.delete.bind(SqlParameterController));

/**
 * @swagger
 * components:
 *   schemas:
 *     SqlParameter:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: sql-parameter-1772810968190-k4qab5mcd
 *         profileId:
 *           type: string
 *           example: profile-1772797781825-jnbxsfpd2
 *         index:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: id
 *         dataType:
 *           type: string
 *           enum: [string, number, boolean, date, datetime, json, uuid]
 *           example: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     SqlParameterArrayItemInput:
 *       type: object
 *       required:
 *         - index
 *         - name
 *         - dataType
 *       properties:
 *         id:
 *           type: string
 *           description: Optional existing SQL parameter ID
 *         index:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: id
 *         dataType:
 *           type: string
 *           enum: [string, number, boolean, date, datetime, json, uuid]
 *           example: number
 *
 *     CreateSqlParameterRequest:
 *       type: object
 *       required:
 *         - profileId
 *         - index
 *         - name
 *         - dataType
 *       properties:
 *         profileId:
 *           type: string
 *           example: profile-1772797781825-jnbxsfpd2
 *         index:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: id
 *         dataType:
 *           type: string
 *           enum: [string, number, boolean, date, datetime, json, uuid]
 *           example: number
 *
 *     UpdateSqlParameterRequest:
 *       type: object
 *       properties:
 *         profileId:
 *           type: string
 *         index:
 *           type: integer
 *         name:
 *           type: string
 *         dataType:
 *           type: string
 *           enum: [string, number, boolean, date, datetime, json, uuid]
 */

export default router;
