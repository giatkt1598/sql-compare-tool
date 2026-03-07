import express from 'express';
import SqlController from '../controllers/SqlController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: SQL
 *     description: SQL connection utilities
 */

/**
 * @swagger
 * /api/sql/test-connection:
 *   post:
 *     summary: Test SQL connection directly
 *     description: Test database connection using provider and connection payload without saving a profile.
 *     tags:
 *       - SQL
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SqlTestConnectionRequest'
 *     responses:
 *       200:
 *         description: Connection successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SqlTestConnectionResponse'
 *       400:
 *         description: Connection failed or invalid input
 */
router.post('/test-connection', SqlController.testConnection.bind(SqlController));
router.get(
  '/test-cases/:testCaseId/events',
  SqlController.streamTestCaseEvents.bind(SqlController)
);
router.get(
  '/test-cases/:testCaseId/latest-result',
  SqlController.getLatestTestCaseResult.bind(SqlController)
);
/**
 * @swagger
 * /api/sql/run-test-case:
 *   post:
 *     summary: Run one test case
 *     description: Execute old/new SQL files for a test case, compare result sets, persist output JSON files, and update testcase execution fields.
 *     tags:
 *       - SQL
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SqlRunTestCaseRequest'
 *     responses:
 *       200:
 *         description: Test case executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SqlRunTestCaseResponse'
 *       400:
 *         description: Invalid input or execution failure
 *       404:
 *         description: TestCase or Profile not found
 */
router.post('/run-test-case', SqlController.runTestCase.bind(SqlController));
router.post('/run-many-test-cases', SqlController.runManyTestCases.bind(SqlController));

/**
 * @swagger
 * components:
 *   schemas:
 *     SqlTestConnectionRequest:
 *       type: object
 *       required:
 *         - sqlProvider
 *         - sqlConnection
 *       properties:
 *         sqlProvider:
 *           type: string
 *           enum:
 *             - SqlServer
 *             - Postgres
 *           example: SqlServer
 *         sqlConnection:
 *           type: object
 *           required:
 *             - host
 *             - username
 *           properties:
 *             host:
 *               type: string
 *               example: localhost
 *             port:
 *               type: integer
 *               example: 1433
 *             database:
 *               type: string
 *               example: master
 *             username:
 *               type: string
 *               example: sa
 *             password:
 *               type: string
 *               example: password
 *             authType:
 *               type: string
 *               example: SqlServerAuth
 *             encrypt:
 *               type: boolean
 *               example: true
 *             trustServerCertificate:
 *               type: boolean
 *               example: true
 *             sslMode:
 *               type: string
 *               example: prefer
 *
 *     SqlTestConnectionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Connection to SqlServer successful
 *         timestamp:
 *           type: string
 *           format: date-time
 *
 *     SqlRunTestCaseRequest:
 *       type: object
 *       required:
 *         - testCaseId
 *       properties:
 *         testCaseId:
 *           type: string
 *           example: testcase-1772810968190-k4qab5mcd
 *         draft:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             parameter:
 *               type: string
 *             enabled:
 *               type: boolean
 *
 *     SqlRunTestCaseResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Run test case completed
 *         testCaseId:
 *           type: string
 *         profileId:
 *           type: string
 *         status:
 *           type: string
 *           enum: [success, failed, running, error]
 *         error:
 *           type: string
 *           nullable: true
 *         executionDuration:
 *           type: number
 *           example: 125
 *         executionTime:
 *           type: string
 *           format: date-time
 *         files:
 *           type: object
 *           properties:
 *             oldResultPath:
 *               type: string
 *             newResultPath:
 *               type: string
 *             diffResultPath:
 *               type: string
 *         diffSummary:
 *           type: object
 *           properties:
 *             executionTime:
 *               type: string
 *               format: date-time
 *             oldCount:
 *               type: integer
 *             newCount:
 *               type: integer
 *             differenceCount:
 *               type: integer
 *             onlyInOldCount:
 *               type: integer
 *             onlyInNewCount:
 *               type: integer
 *             changedCount:
 *               type: integer
 *             matched:
 *               type: boolean
 */

export default router;
