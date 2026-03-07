import type { Request, Response } from 'express';
import TestCaseService from '../services/TestCaseService';
import {
  TEST_CASE_EXECUTION_RESULTS,
  type NullableTestCaseExecutionResult,
  type TestCaseExecutionResult,
} from '../types/testCase';

class TestCaseController {
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
        executionCount?: number;
        executionResult?: string | null;
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
        payload.executionResult !== undefined &&
        payload.executionResult !== null &&
        !TEST_CASE_EXECUTION_RESULTS.includes(payload.executionResult as TestCaseExecutionResult)
      ) {
        res.status(400).json({
          success: false,
          message: `executionResult must be one of: ${TEST_CASE_EXECUTION_RESULTS.join(', ')}`,
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
        executionCount,
        executionResult: (payload.executionResult ?? null) as NullableTestCaseExecutionResult,
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
        executionCount?: number;
        executionResult?: string | null;
        executionDuration?: number | null;
        executionTime?: string | null;
        enabled?: boolean;
      };

      if (!payload || Object.keys(payload).length === 0) {
        res.status(400).json({ success: false, message: 'No data to update' });
        return;
      }

      if (
        payload.executionResult !== undefined &&
        payload.executionResult !== null &&
        !TEST_CASE_EXECUTION_RESULTS.includes(payload.executionResult as TestCaseExecutionResult)
      ) {
        res.status(400).json({
          success: false,
          message: `executionResult must be one of: ${TEST_CASE_EXECUTION_RESULTS.join(', ')}`,
        });
        return;
      }

      const updated = TestCaseService.update(id, {
        profileId: payload.profileId,
        orderIndex: payload.orderIndex,
        name: payload.name,
        parameter: payload.parameter,
        executionCount: payload.executionCount,
        executionResult:
          payload.executionResult !== undefined
            ? (payload.executionResult as NullableTestCaseExecutionResult)
            : undefined,
        executionDuration:
          payload.executionDuration !== undefined ? payload.executionDuration : undefined,
        executionTime: payload.executionTime,
        enabled: payload.enabled,
      });
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
}

export default new TestCaseController();
