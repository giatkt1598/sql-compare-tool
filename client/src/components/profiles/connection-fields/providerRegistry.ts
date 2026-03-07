import type { SqlConnection, SqlProvider } from '../../../models/profile';
import MySqlConnectionFields from './MySqlConnectionFields';
import PostgresConnectionFields from './PostgresConnectionFields';
import {
  MySqlProviderIcon,
  PostgresProviderIcon,
  SqlServerProviderIcon,
} from './providerIcons';
import SqlServerConnectionFields from './SqlServerConnectionFields';
import type { ConnectionFieldConfig } from './types';

export const connectionFieldConfigs: ConnectionFieldConfig[] = [
  {
    provider: 'SqlServer',
    label: 'SQL Server',
    icon: SqlServerProviderIcon,
    defaultConnection: {
      host: 'localhost',
      port: 1433,
      database: '',
      username: 'sa',
      password: '',
      authType: 'SqlServerAuth',
      encrypt: true,
      trustServerCertificate: true,
      multipleActiveResultSets: true,
    },
    component: SqlServerConnectionFields,
  },
  {
    provider: 'Postgres',
    label: 'Postgres',
    icon: PostgresProviderIcon,
    defaultConnection: {
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      username: 'postgres',
      password: '',
      sslMode: 'prefer',
    },
    component: PostgresConnectionFields,
  },
  {
    provider: 'MySQL',
    label: 'MySQL',
    icon: MySqlProviderIcon,
    defaultConnection: {
      host: 'localhost',
      port: 3306,
      database: '',
      username: 'root',
      password: '',
    },
    component: MySqlConnectionFields,
  },
];

export const connectionFieldConfigByProvider = Object.fromEntries(
  connectionFieldConfigs.map((config) => [config.provider, config])
) as Record<SqlProvider, ConnectionFieldConfig>;

export function getProviderLabel(provider: SqlProvider): string {
  return connectionFieldConfigByProvider[provider]?.label ?? provider;
}

export function getDefaultConnection(provider: SqlProvider): SqlConnection {
  return { ...connectionFieldConfigByProvider[provider].defaultConnection };
}
