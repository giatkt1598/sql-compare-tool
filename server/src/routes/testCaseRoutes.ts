import express from 'express';
import TestCaseController from '../controllers/TestCaseController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Test Cases
 *     description: Test case management endpoints
 */

/**
 * @swagger
 * /api/test-cases/profile/{profileId}:
 *   get:
 *     summary: Get test cases by profile ID
 *     description: Returns all test cases assigned to the specified profile.
 *     tags:
 *       - Test Cases
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *         description: Profile ID
 *     responses:
 *       200:
 *         description: Test cases returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestCase'
 *       400:
 *         description: Invalid profile ID
 */
router.get('/profile/:profileId', TestCaseController.getByProfileId.bind(TestCaseController));

/**
 * @swagger
 * /api/test-cases:
 *   get:
 *     summary: Get all test cases
 *     description: Returns all test cases stored in the system.
 *     tags:
 *       - Test Cases
 *     responses:
 *       200:
 *         description: Test cases returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestCase'
 *       500:
 *         description: Unexpected server error
 *
 *   post:
 *     summary: Create a test case
 *     description: Creates a new test case for a profile.
 *     tags:
 *       - Test Cases
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTestCaseRequest'
 *     responses:
 *       201:
 *         description: Test case created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestCase'
 *       400:
 *         description: Invalid request payload
 *       404:
 *         description: Profile not found
 */
router.get('/', TestCaseController.getAll.bind(TestCaseController));
router.post('/', TestCaseController.create.bind(TestCaseController));
router.post('/import/preview', TestCaseController.previewImport.bind(TestCaseController));
router.post('/import', TestCaseController.importFromExcel.bind(TestCaseController));

/**
 * @swagger
 * /api/test-cases/{id}:
 *   get:
 *     summary: Get a test case by ID
 *     description: Returns a single test case by its ID.
 *     tags:
 *       - Test Cases
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test case ID
 *     responses:
 *       200:
 *         description: Test case returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestCase'
 *       404:
 *         description: Test case not found
 *
 *   patch:
 *     summary: Update a test case
 *     description: Partially updates an existing test case.
 *     tags:
 *       - Test Cases
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test case ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTestCaseRequest'
 *     responses:
 *       200:
 *         description: Test case updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestCase'
 *       400:
 *         description: Invalid request payload
 *       404:
 *         description: Test case not found
 *
 *   delete:
 *     summary: Delete a test case
 *     description: Deletes a test case by its ID.
 *     tags:
 *       - Test Cases
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test case ID
 *     responses:
 *       200:
 *         description: Test case deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteEntityResponse'
 *       404:
 *         description: Test case not found
 */
router.get('/:id', TestCaseController.getById.bind(TestCaseController));
router.patch('/:id', TestCaseController.update.bind(TestCaseController));
router.delete('/:id', TestCaseController.delete.bind(TestCaseController));

/**
 * @swagger
 * components:
 *   schemas:
 *     TestCase:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: testcase-1772810968190-k4qab5mcd
 *         profileId:
 *           type: string
 *           example: profile-1772797781825-jnbxsfpd2
 *         orderIndex:
 *           type: integer
 *           example: 0
 *         name:
 *           type: string
 *           example: TC-001
 *         parameter:
 *           type: string
 *           example: '{"id":1,"email":"","enabled":true}'
 *         compareInOrder:
 *           type: boolean
 *           example: false
 *         parallelExecution:
 *           type: boolean
 *           example: true
 *         autoRunWhenSqlChanges:
 *           type: boolean
 *           example: false
 *         executionCount:
 *           type: integer
 *           example: 3
 *         status:
 *           type: string
 *           nullable: true
 *           enum: [success, failed, running, error]
 *         error:
 *           type: string
 *           nullable: true
 *         executionDuration:
 *           type: number
 *           nullable: true
 *           example: 1250
 *         executionTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         enabled:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateTestCaseRequest:
 *       type: object
 *       required:
 *         - profileId
 *         - orderIndex
 *         - name
 *       properties:
 *         profileId:
 *           type: string
 *           example: profile-1772797781825-jnbxsfpd2
 *         orderIndex:
 *           type: integer
 *           example: 0
 *         name:
 *           type: string
 *           example: TC-001
 *         parameter:
 *           type: string
 *         compareInOrder:
 *           type: boolean
 *           example: false
 *         parallelExecution:
 *           type: boolean
 *           example: true
 *         autoRunWhenSqlChanges:
 *           type: boolean
 *           example: false
 *         executionCount:
 *           type: integer
 *           example: 0
 *         status:
 *           type: string
 *           nullable: true
 *           enum: [success, failed, running, error]
 *         error:
 *           type: string
 *           nullable: true
 *         executionDuration:
 *           type: number
 *           nullable: true
 *         executionTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         enabled:
 *           type: boolean
 *           example: true
 *
 *     UpdateTestCaseRequest:
 *       type: object
 *       properties:
 *         profileId:
 *           type: string
 *         orderIndex:
 *           type: integer
 *         name:
 *           type: string
 *         parameter:
 *           type: string
 *         compareInOrder:
 *           type: boolean
 *         parallelExecution:
 *           type: boolean
 *         autoRunWhenSqlChanges:
 *           type: boolean
 *         executionCount:
 *           type: integer
 *         status:
 *           type: string
 *           nullable: true
 *           enum: [success, failed, running, error]
 *         error:
 *           type: string
 *           nullable: true
 *         executionDuration:
 *           type: number
 *           nullable: true
 *         executionTime:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         enabled:
 *           type: boolean
 */

export default router;
