import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';
import { DATA_DIR, FILE_PATHS } from '../config/fileConstants';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SAMPLE_POSTGRES_ROOT = path.join(REPO_ROOT, 'sql-sample-data-test', 'postgres');
const SAMPLE_SCHEMA_SQL_PATH = path.join(SAMPLE_POSTGRES_ROOT, '01_create_schema_and_seed.sql');
const SAMPLE_OLD_SQL_PATH = path.join(
  SAMPLE_POSTGRES_ROOT,
  'get-user-list',
  'query old.sql'
);
const SAMPLE_NEW_SQL_PATH = path.join(
  SAMPLE_POSTGRES_ROOT,
  'get-user-list',
  'query new.sql'
);

const DEMO_PROFILE_ID = 'profile-demo-postgres-user-access';
const DEMO_TEST_CASE_1_ID = 'testcase-demo-active-users';
const DEMO_TEST_CASE_2_ID = 'testcase-demo-org-admin';

class DataMigrationService {
  async runOnStartup(): Promise<void> {
    if (!this.shouldSeedAppData()) {
      return;
    }

    fs.mkdirSync(DATA_DIR, { recursive: true });
    this.seedDemoAppData();

    try {
      await this.seedDemoPostgresDatabase();
      console.log('[data-migration] Demo app data and Postgres sample data seeded.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected Postgres seed error';
      console.warn(`[data-migration] Demo app data seeded, Postgres seed failed: ${message}`);
    }
  }

  private shouldSeedAppData(): boolean {
    if (!fs.existsSync(DATA_DIR)) {
      return true;
    }

    return [FILE_PATHS.PROFILES, FILE_PATHS.SQL_PARAMETERS, FILE_PATHS.TEST_CASES].every(
      (filePath) => this.isJsonArrayFileEmpty(filePath)
    );
  }

  private isJsonArrayFileEmpty(filePath: string): boolean {
    if (!fs.existsSync(filePath)) {
      return true;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf8').trim();
      if (!raw) {
        return true;
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length === 0;
    } catch {
      return false;
    }
  }

  private seedDemoAppData(): void {
    const createdAt = new Date().toISOString();

    const profiles = [
      {
        id: DEMO_PROFILE_ID,
        name: 'Demo - Postgres user access compare',
        description:
          'Seeded demo profile for comparing old and new Postgres SQL results with sample user access data.',
        oldSqlFilePath: SAMPLE_OLD_SQL_PATH,
        newSqlFilePath: SAMPLE_NEW_SQL_PATH,
        sqlProvider: 'Postgres',
        sqlConnection: {
          host: 'localhost',
          port: 5432,
          database: 'postgres',
          username: 'postgres',
          password: '',
        },
        testCases: [DEMO_TEST_CASE_1_ID, DEMO_TEST_CASE_2_ID],
        createdAt,
        updatedAt: createdAt,
      },
    ];

    const sqlParameters = [
      {
        id: 'sqlparam-demo-id',
        profileId: DEMO_PROFILE_ID,
        index: 1,
        name: 'id',
        dataType: 'number',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'sqlparam-demo-email',
        profileId: DEMO_PROFILE_ID,
        index: 2,
        name: 'email',
        dataType: 'string',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'sqlparam-demo-enabled',
        profileId: DEMO_PROFILE_ID,
        index: 3,
        name: 'enabled',
        dataType: 'boolean',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'sqlparam-demo-org-access',
        profileId: DEMO_PROFILE_ID,
        index: 4,
        name: 'org_access',
        dataType: 'string',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'sqlparam-demo-location-access',
        profileId: DEMO_PROFILE_ID,
        index: 5,
        name: 'location_access',
        dataType: 'string',
        createdAt,
        updatedAt: createdAt,
      },
    ];

    const testCases = [
      {
        id: DEMO_TEST_CASE_1_ID,
        profileId: DEMO_PROFILE_ID,
        orderIndex: 1,
        name: '#1 Active users overview',
        parameter: JSON.stringify(
          {
            id: null,
            email: null,
            enabled: true,
            org_access: null,
            location_access: null,
          },
          null,
          2
        ),
        compareInOrder: false,
        parallelExecution: true,
        autoRunWhenSqlChanges: false,
        executionCount: 0,
        status: null,
        error: null,
        executionDuration: null,
        executionTime: null,
        enabled: true,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: DEMO_TEST_CASE_2_ID,
        profileId: DEMO_PROFILE_ID,
        orderIndex: 2,
        name: '#2 Organization access focus',
        parameter: JSON.stringify(
          {
            id: null,
            email: null,
            enabled: true,
            org_access: 'ORG_ADMIN',
            location_access: null,
          },
          null,
          2
        ),
        compareInOrder: false,
        parallelExecution: true,
        autoRunWhenSqlChanges: false,
        executionCount: 0,
        status: null,
        error: null,
        executionDuration: null,
        executionTime: null,
        enabled: true,
        createdAt,
        updatedAt: createdAt,
      },
    ];

    fs.writeFileSync(FILE_PATHS.PROFILES, JSON.stringify(profiles, null, 2), 'utf8');
    fs.writeFileSync(FILE_PATHS.SQL_PARAMETERS, JSON.stringify(sqlParameters, null, 2), 'utf8');
    fs.writeFileSync(FILE_PATHS.TEST_CASES, JSON.stringify(testCases, null, 2), 'utf8');
  }

  private async seedDemoPostgresDatabase(): Promise<void> {
    if (!fs.existsSync(SAMPLE_SCHEMA_SQL_PATH)) {
      throw new Error(`Sample schema SQL file not found at ${SAMPLE_SCHEMA_SQL_PATH}`);
    }

    const script = fs.readFileSync(SAMPLE_SCHEMA_SQL_PATH, 'utf8');
    const client = new Client({
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: '',
    });

    await client.connect();

    try {
      await client.query(script);
    } finally {
      await client.end();
    }
  }
}

export default new DataMigrationService();
