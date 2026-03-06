import ProfileRepository from '../repositories/ProfileRepository';
import SqlParameterRepository from '../repositories/SqlParameterRepository';
import type {
  CreateSqlParameterInput,
  SqlParameterArrayItemInput,
  UpdateSqlParameterInput,
} from '../types/sqlParameter';

class SqlParameterService {
  getAll() {
    return SqlParameterRepository.getAll();
  }

  getById(id: string) {
    const parameter = SqlParameterRepository.getById(id);
    if (!parameter) {
      throw new Error(`SqlParameter with ID ${id} not found`);
    }
    return parameter;
  }

  getByProfileId(profileId: string) {
    return SqlParameterRepository.getByProfileId(profileId).sort((a, b) => a.index - b.index);
  }

  create(parameterData: CreateSqlParameterInput) {
    const profile = ProfileRepository.getById(parameterData.profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${parameterData.profileId} not found`);
    }

    const duplicated = SqlParameterRepository.getByProfileIdAndIndex(
      parameterData.profileId,
      parameterData.index
    );
    if (duplicated) {
      throw new Error(
        `SqlParameter index ${parameterData.index} already exists for profile ${parameterData.profileId}`
      );
    }

    return SqlParameterRepository.add(parameterData);
  }

  update(id: string, parameterData: UpdateSqlParameterInput) {
    const existing = SqlParameterRepository.getById(id);
    if (!existing) {
      throw new Error(`SqlParameter with ID ${id} not found`);
    }

    const nextProfileId = parameterData.profileId ?? existing.profileId;
    const nextIndex = parameterData.index ?? existing.index;

    const profile = ProfileRepository.getById(nextProfileId);
    if (!profile) {
      throw new Error(`Profile with ID ${nextProfileId} not found`);
    }

    const duplicated = SqlParameterRepository.getByProfileIdAndIndex(nextProfileId, nextIndex);
    if (duplicated && duplicated.id !== id) {
      throw new Error(
        `SqlParameter index ${nextIndex} already exists for profile ${nextProfileId}`
      );
    }

    return SqlParameterRepository.update(id, parameterData);
  }

  delete(id: string) {
    SqlParameterRepository.delete(id);
    return { message: 'SqlParameter deleted successfully', id };
  }

  replaceByProfileId(profileId: string, items: SqlParameterArrayItemInput[]) {
    const profile = ProfileRepository.getById(profileId);
    if (!profile) {
      throw new Error(`Profile with ID ${profileId} not found`);
    }

    const indexes = items.map((item) => item.index);
    const uniqueIndexCount = new Set(indexes).size;
    if (uniqueIndexCount !== indexes.length) {
      throw new Error('Duplicate index found in SqlParameter array');
    }

    return SqlParameterRepository.replaceByProfileId(profileId, items).sort(
      (a, b) => a.index - b.index
    );
  }
}

export default new SqlParameterService();
