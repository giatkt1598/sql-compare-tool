import type {
  SqlParameter,
  SqlParameterArrayItemInput,
  SqlParameterFormInput,
} from '../models/sqlParameter';
import { ApiService } from './base/ApiService';

class SqlParameterApi extends ApiService {
  constructor() {
    super('/api/sql-parameters');
  }

  getByProfileId(profileId: string) {
    return this.get<SqlParameter[]>(`/profile/${profileId}`);
  }

  getById(id: string) {
    return this.get<SqlParameter>(id);
  }

  create(profileId: string, payload: SqlParameterFormInput) {
    return this.post<SqlParameter>('', {
      profileId,
      ...payload,
    });
  }

  update(id: string, payload: Partial<SqlParameterFormInput>) {
    return this.put<SqlParameter>(id, payload);
  }

  remove(id: string) {
    return this.delete<{ message: string; id: string }>(id);
  }

  replaceByProfileId(profileId: string, items: SqlParameterArrayItemInput[]) {
    return this.put<SqlParameter[]>(`/profile/${profileId}`, { items });
  }
}

export const sqlParameterApi = new SqlParameterApi();
