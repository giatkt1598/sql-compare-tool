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
 */

export default router;
