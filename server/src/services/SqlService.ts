import mssql from 'mssql';
import { Client as PgClient, type ClientConfig as PgClientConfig } from 'pg';
import type { ProfileData, SqlProvider } from '../types/profile';

class SqlService {
  async testConnection(sqlProvider: SqlProvider, connection: ProfileData['sqlConnection']) {
    if (!connection.host) {
      throw new Error('Database host is required');
    }

    if (!connection.username) {
      throw new Error('Database username is required');
    }

    if (sqlProvider === 'SqlServer') {
      await this.testSqlServerConnection(connection);
    } else if (sqlProvider === 'Postgres') {
      await this.testPostgresConnection(connection);
    } else {
      throw new Error(`Unsupported SQL provider: ${sqlProvider}`);
    }

    return {
      success: true,
      message: `Connection to ${sqlProvider} successful`,
      timestamp: new Date().toISOString(),
    };
  }

  private parsePort(value: unknown, fallback: number): number {
    const parsed = Number.parseInt(String(value ?? fallback), 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  private async testSqlServerConnection(connection: ProfileData['sqlConnection']) {
    const pool = new mssql.ConnectionPool({
      user: String(connection.username ?? ''),
      password: String(connection.password ?? ''),
      server: String(connection.host ?? ''),
      port: this.parsePort(connection.port, 1433),
      database: String(connection.database ?? ''),
      options: {
        encrypt: Boolean(connection.encrypt ?? true),
        trustServerCertificate: Boolean(connection.trustServerCertificate ?? true),
      },
      connectionTimeout: 5000,
      requestTimeout: 5000,
      pool: {
        max: 1,
        min: 0,
        idleTimeoutMillis: 5000,
      },
    });

    try {
      await pool.connect();
      await pool.request().query('SELECT 1 AS ping');
    } finally {
      await pool.close();
    }
  }

  private async testPostgresConnection(connection: ProfileData['sqlConnection']) {
    const sslMode = String(connection.sslMode ?? 'prefer').toLowerCase();
    const pgConfig: PgClientConfig = {
      host: String(connection.host ?? ''),
      port: this.parsePort(connection.port, 5432),
      database: String(connection.database ?? 'postgres'),
      user: String(connection.username ?? ''),
      password: String(connection.password ?? ''),
      connectionTimeoutMillis: 5000,
      statement_timeout: 5000,
      query_timeout: 5000,
    };

    if (['require', 'verify-ca', 'verify-full'].includes(sslMode)) {
      pgConfig.ssl = {
        rejectUnauthorized: sslMode !== 'require',
      };
    } else {
      pgConfig.ssl = false;
    }

    const client = new PgClient(pgConfig);
    try {
      await client.connect();
      await client.query('SELECT 1 AS ping');
    } finally {
      await client.end();
    }
  }
}

export default new SqlService();
