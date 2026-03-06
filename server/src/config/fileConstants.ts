import path from 'node:path';

const DATA_DIR = path.join(__dirname, '../../data');

export const FILE_PATHS = {
  PROFILES: path.join(DATA_DIR, 'profiles.json'),
  SQL_PARAMETERS: path.join(DATA_DIR, 'sql-parameters.json'),
  TEST_CASES: path.join(DATA_DIR, 'test-cases.json'),
  RESULTS: path.join(DATA_DIR, 'results'),
} as const;

export { DATA_DIR };
