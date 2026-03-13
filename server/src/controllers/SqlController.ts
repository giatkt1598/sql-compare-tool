import type { Request, Response } from 'express';
import SqlService from '../services/SqlService';
import { getRegisteredSqlProviders, isRegisteredSqlProvider } from '../services/sql-providers';
import { decryptPassword } from '../utils/passwordCrypto';
import type { SqlProvider } from '../types/profile';

class SqlController {
  async testConnection(req: Request, res: Response): Promise<void> {
    try {
      const sqlProvider = req.body?.sqlProvider as SqlProvider | undefined;
      const sqlConnection = req.body?.sqlConnection;

      if (!sqlProvider || !isRegisteredSqlProvider(sqlProvider)) {
        res.status(400).json({
          success: false,
          message: `SQL Provider must be one of: ${getRegisteredSqlProviders().join(', ')}`,
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

      const result = await SqlService.testConnection(sqlProvider, {
        ...sqlConnection,
        password: decryptPassword(String(sqlConnection.password ?? '')),
      });
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
      const draft = req.body?.draft as
        | {
            name?: string;
            parameter?: string;
            enabled?: boolean;
            compareInOrder?: boolean;
            parallelExecution?: boolean;
          }
        | undefined;

      if (!testCaseId) {
        res.status(400).json({
          success: false,
          message: 'testCaseId is required',
        });
        return;
      }

      const result = await SqlService.runTestCase(testCaseId, draft);
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

  buildSqlQueryPreview(req: Request, res: Response): void {
    try {
      const testCaseId = String(req.body?.testCaseId ?? '').trim();
      const draft = req.body?.draft as
        | {
            name?: string;
            parameter?: string;
            enabled?: boolean;
            compareInOrder?: boolean;
            parallelExecution?: boolean;
          }
        | undefined;

      if (!testCaseId) {
        res.status(400).json({
          success: false,
          message: 'testCaseId is required',
        });
        return;
      }

      const result = SqlService.buildSqlQueryPreview(testCaseId, draft);
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

  runManyTestCases(req: Request, res: Response): void {
    try {
      const profileId = String(req.body?.profileId ?? '').trim();
      const scope = req.body?.scope === 'all' ? 'all' : 'enabled';
      const runInParallel = Boolean(req.body?.runInParallel);
      const parsedMaxConcurrency = Number.parseInt(String(req.body?.maxConcurrency ?? 8), 10);
      const maxConcurrency = Number.isFinite(parsedMaxConcurrency)
        ? Math.max(1, parsedMaxConcurrency)
        : 8;

      if (!profileId) {
        res.status(400).json({
          success: false,
          message: 'profileId is required',
        });
        return;
      }

      const result = SqlService.runManyTestCases({
        profileId,
        scope,
        runInParallel,
        maxConcurrency,
      });

      res.status(202).json({
        success: true,
        ...result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      const statusCode = message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  async getLatestTestCaseResult(req: Request, res: Response): Promise<void> {
    try {
      const testCaseId = String(req.params.testCaseId ?? '').trim();
      const hasColumnsQuery = Object.prototype.hasOwnProperty.call(req.query, 'columns');
      const rawColumns = Array.isArray(req.query.columns)
        ? req.query.columns.join(',')
        : String(req.query.columns ?? '');
      const parsedColumns = rawColumns
            .split(',')
            .map((column) => column.trim())
            .filter(Boolean);
      const selectedColumns = hasColumnsQuery && parsedColumns.length > 0 ? parsedColumns : undefined;
      if (!testCaseId) {
        res.status(400).json({
          success: false,
          message: 'testCaseId is required',
        });
        return;
      }

      const result = await SqlService.getLatestTestCaseResult(testCaseId, selectedColumns);
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      const statusCode =
        message.includes('not found') || message.includes('No execution result') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  streamTestCaseEvents(req: Request, res: Response): void {
    const testCaseId = String(req.params.testCaseId ?? '').trim();
    if (!testCaseId) {
      res.status(400).json({
        success: false,
        message: 'testCaseId is required',
      });
      return;
    }

    const cleanup = SqlService.subscribeToTestCaseEvents(testCaseId, res);
    req.on('close', cleanup);
  }

  streamProfileTestCaseEvents(req: Request, res: Response): void {
    const profileId = String(req.params.profileId ?? '').trim();
    if (!profileId) {
      res.status(400).json({
        success: false,
        message: 'profileId is required',
      });
      return;
    }

    const cleanup = SqlService.subscribeToProfileTestCaseEvents(profileId, res);
    req.on('close', cleanup);
  }
}

export default new SqlController();
