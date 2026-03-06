import type { Request, Response } from 'express';
import SqlParameterService from '../services/SqlParameterService';
import {
  SQL_PARAMETER_DATA_TYPES,
  type SqlParameterArrayItemInput,
  type SqlParameterDataType,
  type UpdateSqlParameterInput,
} from '../types/sqlParameter';

class SqlParameterController {
  getAll(_req: Request, res: Response): void {
    try {
      const parameters = SqlParameterService.getAll();
      res.status(200).json(parameters);
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
      const parameter = SqlParameterService.getById(id);
      res.status(200).json(parameter);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unexpected error',
      });
    }
  }

  getByProfileId(req: Request, res: Response): void {
    try {
      const profileId = String(req.params.profileId);
      if (!profileId) {
        res.status(400).json({
          success: false,
          message: 'profileId is required',
        });
        return;
      }

      const parameters = SqlParameterService.getByProfileId(profileId);
      res.status(200).json(parameters);
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
        index?: number;
        name?: string;
        dataType?: string;
      };

      if (!payload.profileId) {
        res.status(400).json({ success: false, message: 'profileId is required' });
        return;
      }

      if (!Number.isInteger(payload.index)) {
        res.status(400).json({ success: false, message: 'index must be an integer' });
        return;
      }

      if (!payload.name) {
        res.status(400).json({ success: false, message: 'name is required' });
        return;
      }

      if (!payload.dataType || !SQL_PARAMETER_DATA_TYPES.includes(payload.dataType as never)) {
        res.status(400).json({
          success: false,
          message: `dataType must be one of: ${SQL_PARAMETER_DATA_TYPES.join(', ')}`,
        });
        return;
      }

      const dataType = payload.dataType as SqlParameterDataType;
      const index = Number(payload.index);

      const created = SqlParameterService.create({
        profileId: payload.profileId,
        index,
        name: payload.name,
        dataType,
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
        index?: number;
        name?: string;
        dataType?: string;
      };

      if (!payload || Object.keys(payload).length === 0) {
        res.status(400).json({ success: false, message: 'No data to update' });
        return;
      }

      if (
        payload.dataType &&
        !SQL_PARAMETER_DATA_TYPES.includes(payload.dataType as SqlParameterDataType)
      ) {
        res.status(400).json({
          success: false,
          message: `dataType must be one of: ${SQL_PARAMETER_DATA_TYPES.join(', ')}`,
        });
        return;
      }

      const updateData: UpdateSqlParameterInput = {
        profileId: payload.profileId,
        index: payload.index,
        name: payload.name,
        dataType: payload.dataType as SqlParameterDataType | undefined,
      };
      const updated = SqlParameterService.update(id, updateData);
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
      const result = SqlParameterService.delete(id);
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

  replaceByProfileId(req: Request, res: Response): void {
    try {
      const profileId = String(req.params.profileId);
      const payload = req.body as { items?: SqlParameterArrayItemInput[] };
      const items = Array.isArray(payload?.items) ? payload.items : null;

      if (!profileId) {
        res.status(400).json({ success: false, message: 'profileId is required' });
        return;
      }

      if (!items) {
        res.status(400).json({ success: false, message: 'items array is required' });
        return;
      }

      const invalidItem = items.find(
        (item) =>
          !Number.isInteger(item.index) ||
          !item.name ||
          !item.dataType ||
          !SQL_PARAMETER_DATA_TYPES.includes(item.dataType)
      );

      if (invalidItem) {
        res.status(400).json({
          success: false,
          message: 'Each item must contain valid index (integer), name, and dataType',
        });
        return;
      }

      const replaced = SqlParameterService.replaceByProfileId(profileId, items);
      res.status(200).json(replaced);
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

export default new SqlParameterController();
