import type { Profile, ProfileFormInput } from '../../models/profile';
import { getDefaultConnection } from './connection-fields/providerRegistry';

export const defaultProfileFormInput: ProfileFormInput = {
  name: '',
  description: '',
  oldSqlFilePath: '',
  newSqlFilePath: '',
  sqlProvider: 'SqlServer',
  sqlConnection: getDefaultConnection('SqlServer'),
  providerConnections: {
    SqlServer: getDefaultConnection('SqlServer'),
  },
  testCases: [],
};

export function toProfileFormInput(profile: Profile): ProfileFormInput {
  const providerConnections = {
    [profile.sqlProvider]: {
      ...getDefaultConnection(profile.sqlProvider),
      ...profile.sqlConnection,
    },
  };

  return {
    name: profile.name,
    description: profile.description,
    oldSqlFilePath: profile.oldSqlFilePath,
    newSqlFilePath: profile.newSqlFilePath,
    sqlProvider: profile.sqlProvider,
    sqlConnection: {
      ...providerConnections[profile.sqlProvider],
    },
    providerConnections,
    testCases: profile.testCases,
  };
}

export function toProfilePayload(
  formValue: ProfileFormInput
): Omit<Profile, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: formValue.name,
    description: formValue.description,
    oldSqlFilePath: formValue.oldSqlFilePath,
    newSqlFilePath: formValue.newSqlFilePath,
    sqlProvider: formValue.sqlProvider,
    sqlConnection: formValue.providerConnections[formValue.sqlProvider] ?? formValue.sqlConnection,
    testCases: formValue.testCases,
  };
}
