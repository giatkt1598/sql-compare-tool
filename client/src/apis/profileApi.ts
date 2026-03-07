import type { Profile } from '../models/profile';
import { ApiService } from './base/ApiService';

export type ProfilePayload = Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>;

class ProfileApi extends ApiService {
  constructor() {
    super('/api/profiles');
  }

  getAll() {
    return this.get<Profile[]>();
  }

  getById(id: string) {
    return this.get<Profile>(id);
  }

  create(payload: ProfilePayload) {
    return this.post<Profile>('', payload);
  }

  update(id: string, payload: Partial<ProfilePayload>) {
    return this.put<Profile>(id, payload);
  }

  remove(id: string) {
    return this.delete<{ message: string; id: string }>(id);
  }

  async backup(id: string) {
    const response = await this.requestResponse<Blob>({
      method: 'GET',
      url: `/api/profiles/${id}/backup`,
      responseType: 'blob',
    });

    const explicitFileName = response.headers['x-backup-file-name'];
    const contentDisposition = response.headers['content-disposition'];
    const matchedFileName =
      typeof contentDisposition === 'string'
        ? contentDisposition.match(/filename="?([^"]+)"?/)?.[1]
        : undefined;

    return {
      blob: response.data,
      fileName: explicitFileName ?? matchedFileName ?? `profile-${id}.zip`,
    };
  }

  restore(file: File) {
    return this.post<{
      message: string;
      profileId: string;
      restoredProfileName: string;
      replacedExisting: boolean;
    }>('/restore', file, {
      headers: {
        'Content-Type': file.type || 'application/zip',
      },
    });
  }
}

export const profileApi = new ProfileApi();
