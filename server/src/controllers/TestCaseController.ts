import type { Request, Response } from 'express';
import TestCaseService from '../services/TestCaseService';
import {
  TEST_CASE_STATUSES,
  type NullableTestCaseStatus,
  type TestCaseStatus,
} from '../types/testCase';

class TestCaseController {
  private omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)
    ) as Partial<T>;
  }

  getAll(_req: Request, res: Response): void {
    try {
      const testCases = TestCaseService.getAll();
      res.status(200).json(testCases);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unexpected error',
      });
    }
  }

  getById(req: Request, res: Response): void {
    try {
      const id = String(req.params.id);
      const testCase = TestCaseService.getById(id);
      res.status(200).json(testCase);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      const statusCode = message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  getByProfileId(req: Request, res: Response): void {
    try {
      const profileId = String(req.params.profileId);
      if (!profileId) {
        res.status(400).json({ success: false, message: 'profileId is required' });
        return;
      }

      const testCases = TestCaseService.getByProfileId(profileId);
      res.status(200).json(testCases);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unexpected error',
      });
    }
  }

  create(req: Request, res: Response): void {
    try {
      const payload = req.body as {
        profileId?: string;
        orderIndex?: number;
        name?: string;
        parameter?: string;
        compareInOrder?: boolean;
        parallelExecution?: boolean;
        expectedExecutionDuration?: number | null;
        autoRunWhenSqlChanges?: boolean;
        executionCount?: number;
        status?: string | null;
        error?: string | null;
        executionDuration?: number | null;
        executionTime?: string | null;
        enabled?: boolean;
      };

      if (!payload.profileId) {
        res.status(400).json({ success: false, message: 'profileId is required' });
        return;
      }

      if (!Number.isInteger(payload.orderIndex)) {
        res.status(400).json({ success: false, message: 'orderIndex must be an integer' });
        return;
      }

      if (!payload.name) {
        res.status(400).json({ success: false, message: 'name is required' });
        return;
      }

      if (
        payload.status !== undefined &&
        payload.status !== null &&
        !TEST_CASE_STATUSES.includes(payload.status as TestCaseStatus)
      ) {
        res.status(400).json({
          success: false,
          message: `status must be one of: ${TEST_CASE_STATUSES.join(', ')}`,
        });
        return;
      }

      const orderIndex = Number(payload.orderIndex);
      const executionCount = Number.isInteger(payload.executionCount)
        ? Number(payload.executionCount)
        : 0;

      const created = TestCaseService.create({
        profileId: payload.profileId,
        orderIndex,
        name: payload.name,
        parameter: payload.parameter ?? '',
        compareInOrder: payload.compareInOrder ?? false,
        parallelExecution: payload.parallelExecution ?? true,
        expectedExecutionDuration:
          payload.expectedExecutionDuration === undefined ? null : payload.expectedExecutionDuration,
        autoRunWhenSqlChanges: payload.autoRunWhenSqlChanges ?? false,
        executionCount,
        status: (payload.status ?? null) as NullableTestCaseStatus,
        error: payload.error ?? null,
        executionDuration:
          payload.executionDuration === undefined ? null : payload.executionDuration,
        executionTime: payload.executionTime ?? null,
        enabled: payload.enabled ?? true,
      });

      res.status(201).json(created);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      const statusCode = message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  update(req: Request, res: Response): void {
    try {
      const id = String(req.params.id);
      const payload = req.body as {
        profileId?: string;
        orderIndex?: number;
        name?: string;
        parameter?: string;
        compareInOrder?: boolean;
        parallelExecution?: boolean;
        expectedExecutionDuration?: number | null;
        autoRunWhenSqlChanges?: boolean;
        executionCount?: number;
        status?: string | null;
        error?: string | null;
        executionDuration?: number | null;
        executionTime?: string | null;
        enabled?: boolean;
      };

      if (!payload || Object.keys(payload).length === 0) {
        res.status(400).json({ success: false, message: 'No data to update' });
        return;
      }

      if (
        payload.status !== undefined &&
        payload.status !== null &&
        !TEST_CASE_STATUSES.includes(payload.status as TestCaseStatus)
      ) {
        res.status(400).json({
          success: false,
          message: `status must be one of: ${TEST_CASE_STATUSES.join(', ')}`,
        });
        return;
      }

      const updatePayload = this.omitUndefined({
        profileId: payload.profileId,
        orderIndex: payload.orderIndex,
        name: payload.name,
        parameter: payload.parameter,
        compareInOrder: payload.compareInOrder,
        parallelExecution: payload.parallelExecution,
        expectedExecutionDuration:
          payload.expectedExecutionDuration !== undefined
            ? payload.expectedExecutionDuration
            : undefined,
        autoRunWhenSqlChanges: payload.autoRunWhenSqlChanges,
        executionCount: payload.executionCount,
        status:
          payload.status !== undefined ? (payload.status as NullableTestCaseStatus) : undefined,
        error: payload.error,
        executionDuration:
          payload.executionDuration !== undefined ? payload.executionDuration : undefined,
        executionTime: payload.executionTime,
        enabled: payload.enabled,
      });

      const updated = TestCaseService.update(id, updatePayload);
      res.status(200).json(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      const statusCode = message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  delete(req: Request, res: Response): void {
    try {
      const id = String(req.params.id);
      const result = TestCaseService.delete(id);
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

  deleteMany(req: Request, res: Response): void {
    try {
      const payload = req.body as { ids?: string[] };
      const ids = Array.isArray(payload.ids) ? payload.ids.filter(Boolean) : [];
      if (ids.length === 0) {
        res.status(400).json({ success: false, message: 'ids is required' });
        return;
      }

      const result = TestCaseService.deleteMany(ids);
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  previewImport(req: Request, res: Response): void {
    try {
      const payload = req.body as { profileId?: string; names?: string[] };
      const profileId = String(payload.profileId ?? '').trim();
      const names = Array.isArray(payload.names) ? payload.names : [];

      if (!profileId) {
        res.status(400).json({ success: false, message: 'profileId is required' });
        return;
      }

      const result = TestCaseService.previewImport(profileId, names);
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  importFromExcel(req: Request, res: Response): void {
    try {
      const payload = req.body as {
        profileId?: string;
        rows?: Array<{
          name?: string;
          compareInOrder?: boolean;
          parallelExecution?: boolean;
          enabled?: boolean;
          expectedExecutionDuration?: number | null;
          parameter?: Record<string, unknown>;
        }>;
      };

      const profileId = String(payload.profileId ?? '').trim();
      const rows = Array.isArray(payload.rows) ? payload.rows : [];

      if (!profileId) {
        res.status(400).json({ success: false, message: 'profileId is required' });
        return;
      }

      const result = TestCaseService.importFromExcel(profileId, rows);
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  async exportReport(req: Request, res: Response): Promise<void> {
    try {
      const profileId = String(req.params.profileId ?? '').trim();
      if (!profileId) {
        res.status(400).json({ success: false, message: 'profileId is required' });
        return;
      }

      const { fileName, buffer } = await TestCaseService.exportReport(profileId);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('X-Report-File-Name', fileName);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.status(200).send(buffer);
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

export default new TestCaseController();
