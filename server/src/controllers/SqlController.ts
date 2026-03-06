import type { Request, Response } from 'express';
import SqlService from '../services/SqlService';
import type { SqlProvider } from '../types/profile';

class SqlController {
  async testConnection(req: Request, res: Response): Promise<void> {
    try {
      const sqlProvider = req.body?.sqlProvider as SqlProvider | undefined;
      const sqlConnection = req.body?.sqlConnection;

      if (!sqlProvider || !['SqlServer', 'Postgres'].includes(sqlProvider)) {
        res.status(400).json({
          success: false,
          message: 'SQL Provider must be either SqlServer or Postgres',
        });
        return;
      }

      if (!sqlConnection || typeof sqlConnection !== 'object') {
        res.status(400).json({
          success: false,
          message: 'Database connection details are required',
        });
        return;
      }

      const result = await SqlService.testConnection(sqlProvider, sqlConnection);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unexpected error',
      });
    }
  }

  async runTestCase(req: Request, res: Response): Promise<void> {
    try {
      const testCaseId = String(req.body?.testCaseId ?? '').trim();
      if (!testCaseId) {
        res.status(400).json({
          success: false,
          message: 'testCaseId is required',
        });
        return;
      }

      const result = await SqlService.runTestCase(testCaseId);
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      const statusCode = message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }
}

export default new SqlController();
