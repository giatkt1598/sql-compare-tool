import { FILE_PATHS } from '../config/fileConstants';
import SqlParameter from '../models/SqlParameter';
import BaseRepository from './BaseRepository';

class SqlParameterRepository extends BaseRepository<
  SqlParameter,
  ReturnType<SqlParameter['toJSON']>
> {
  constructor() {
    super(FILE_PATHS.SQL_PARAMETERS, SqlParameter);
  }

  getByProfileId(profileId: string): SqlParameter[] {
    return this.where((parameter) => parameter.profileId === profileId);
  }

  getByProfileIdAndIndex(profileId: string, index: number): SqlParameter | null {
    return this.single(
      (parameter) => parameter.profileId === profileId && parameter.index === index
    );
  }

  replaceByProfileId(
    profileId: string,
    items: Array<Partial<ReturnType<SqlParameter['toJSON']>>>
  ): SqlParameter[] {
    const remaining = this.getAllRaw().filter((item) => item.profileId !== profileId);
    const created: SqlParameter[] = [];

    for (const item of items) {
      const entity = new SqlParameter({
        ...item,
        profileId,
      });
      const validation = entity.validate();
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      created.push(entity);
    }

    this.saveAllRaw([...remaining, ...created.map((item) => item.toJSON())]);
    return created;
  }
}

export default new SqlParameterRepository();
