import type { Request, Response } from 'express';
import ProfileService from '../services/ProfileService';
import { getRegisteredSqlProviders, isRegisteredSqlProvider } from '../services/sql-providers';
import { encryptPassword } from '../utils/passwordCrypto';
import {
  type CreateProfileInput,
  type ProfileData,
  type SqlProvider,
  type UpdateProfileInput,
} from '../types/profile';

class ProfileController {
  getAllProfiles(_req: Request, res: Response): void {
    try {
      const profiles = ProfileService.getAllProfiles().map((profile) =>
        this.serializeProfile(profile.toJSON())
      );
      res.status(200).json(profiles);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unexpected error',
      });
    }
  }

  getProfileById(req: Request, res: Response): void {
    try {
      const id = String(req.params.id);
      const profile = ProfileService.getProfileById(id);
      res.status(200).json(this.serializeProfile(profile.toJSON()));
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unexpected error',
      });
    }
  }

  createProfile(req: Request, res: Response): void {
    try {
      const profileData = req.body as Partial<CreateProfileInput>;

      if (!profileData.name) {
        res.status(400).json({ success: false, message: 'Profile name is required' });
        return;
      }

      if (!profileData.sqlProvider || !isRegisteredSqlProvider(profileData.sqlProvider)) {
        res.status(400).json({
          success: false,
          message: `SQL Provider must be one of: ${getRegisteredSqlProviders().join(', ')}`,
        });
        return;
      }

      if (!profileData.oldSqlFilePath && !profileData.oldSqlContent) {
        res.status(400).json({
          success: false,
          message: 'Old SQL file path or inline SQL content is required',
        });
        return;
      }

      if (!profileData.newSqlFilePath && !profileData.newSqlContent) {
        res.status(400).json({
          success: false,
          message: 'New SQL file path or inline SQL content is required',
        });
        return;
      }

      if (!profileData.sqlConnection || !profileData.sqlConnection.host) {
        res.status(400).json({
          success: false,
          message: 'Database connection details are required',
        });
        return;
      }

      const newProfile = ProfileService.createProfile(profileData as CreateProfileInput);
      res.status(201).json(this.serializeProfile(newProfile.toJSON()));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      const statusCode = message.includes('already exists') ? 409 : 400;
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  updateProfile(req: Request, res: Response): void {
    try {
      const id = String(req.params.id);
      const profileData = req.body as UpdateProfileInput;

      if (!profileData || Object.keys(profileData).length === 0) {
        res.status(400).json({ success: false, message: 'No data to update' });
        return;
      }

      const updatedProfile = ProfileService.updateProfile(id, profileData);
      res.status(200).json(this.serializeProfile(updatedProfile.toJSON()));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      const statusCode = message.includes('not found') ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }

  deleteProfile(req: Request, res: Response): void {
    try {
      const id = String(req.params.id);
      const result = ProfileService.deleteProfile(id);
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

  backupProfile(req: Request, res: Response): void {
    try {
      const id = String(req.params.id);
      const { fileName, buffer } = ProfileService.backupProfile(id);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('X-Backup-File-Name', fileName);
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

  restoreProfile(req: Request, res: Response): void {
    try {
      const zipBuffer = Buffer.isBuffer(req.body)
        ? req.body
        : req.body instanceof Uint8Array
          ? Buffer.from(req.body)
          : typeof req.body === 'string'
            ? Buffer.from(req.body)
            : Buffer.from([]);
      if (zipBuffer.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Backup zip file is required',
        });
        return;
      }

      const result = ProfileService.restoreProfileBackup(zipBuffer);
      res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  getByProvider(req: Request, res: Response): void {
    try {
      const provider = req.params.provider as SqlProvider;

      if (!isRegisteredSqlProvider(provider)) {
        res.status(400).json({
          success: false,
          message: `Invalid provider. Must be one of: ${getRegisteredSqlProviders().join(', ')}`,
        });
        return;
      }

      const profiles = ProfileService.getProfilesByProvider(provider).map((profile) =>
        this.serializeProfile(profile.toJSON())
      );
      res.status(200).json(profiles);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unexpected error',
      });
    }
  }

  searchProfiles(req: Request, res: Response): void {
    try {
      const keyword = String(req.params.keyword ?? '');

      if (!keyword || keyword.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Search keyword is required',
        });
        return;
      }

      const profiles = ProfileService.searchProfiles(keyword).map((profile) =>
        this.serializeProfile(profile.toJSON())
      );
      res.status(200).json(profiles);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unexpected error',
      });
    }
  }

  getRecentProfiles(req: Request, res: Response): void {
    try {
      const limitValue = req.params.limit ? String(req.params.limit) : undefined;
      const limit = limitValue ? Number.parseInt(limitValue, 10) : 10;

      if (Number.isNaN(limit) || limit < 1 || limit > 100) {
        res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 100',
        });
        return;
      }

      const profiles = ProfileService.getRecentProfiles(limit).map((profile) =>
        this.serializeProfile(profile.toJSON())
      );
      res.status(200).json(profiles);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unexpected error',
      });
    }
  }

  getStatistics(_req: Request, res: Response): void {
    try {
      const stats = ProfileService.getStatistics();
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unexpected error',
      });
    }
  }

  private serializeProfile(profile: ProfileData): ProfileData {
    if (!profile.sqlConnection) {
      return profile;
    }

    return {
      ...profile,
      sqlConnection: {
        ...profile.sqlConnection,
        password: encryptPassword(String(profile.sqlConnection.password ?? '')),
      },
    };
  }
}

export default new ProfileController();
