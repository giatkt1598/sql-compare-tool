import { FILE_PATHS } from '../config/fileConstants';
import Profile from '../models/Profile';
import { encryptPassword } from '../utils/passwordCrypto';
import BaseRepository from './BaseRepository';

class ProfileRepository extends BaseRepository<Profile, ReturnType<Profile['toJSON']>> {
  constructor() {
    super(FILE_PATHS.PROFILES, Profile);
  }

  protected saveAllRaw(items: ReturnType<Profile['toJSON']>[]): void {
    const encryptedItems = items.map((item) => {
      const sqlConnection = item.sqlConnection
        ? {
            ...item.sqlConnection,
            password: encryptPassword(String(item.sqlConnection.password ?? '')),
          }
        : item.sqlConnection;
      return { ...item, sqlConnection };
    });
    super.saveAllRaw(encryptedItems);
  }

  getByName(name: string): Profile | null {
    return this.single((profile) => profile.name === name);
  }

  getByProvider(provider: Profile['sqlProvider']): Profile[] {
    return this.where((profile) => profile.sqlProvider === provider);
  }

  searchByDescription(keyword: string): Profile[] {
    const normalizedKeyword = keyword.toLowerCase();
    return this.where(
      (profile) =>
        Boolean(profile.description) &&
        profile.description.toLowerCase().includes(normalizedKeyword)
    );
  }

  getCreatedBetween(startDate: Date, endDate: Date): Profile[] {
    return this.where((profile) => {
      const createdAt = new Date(profile.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });
  }

  getRecentProfiles(limit = 10): Profile[] {
    return this.orderBy((profile) => new Date(profile.createdAt), true).slice(0, limit);
  }

  isNameExists(name: string): boolean {
    return this.any((profile) => profile.name === name);
  }

  countByProvider(provider: Profile['sqlProvider']): number {
    return this.count((profile) => profile.sqlProvider === provider);
  }

  getUsedProviders(): Array<Profile['sqlProvider']> {
    return this.distinct((profile) => profile.sqlProvider);
  }
}

export default new ProfileRepository();
