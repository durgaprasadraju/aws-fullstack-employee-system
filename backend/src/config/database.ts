import mysql, { Pool, PoolOptions, ResultSetHeader, RowDataPacket, ExecuteValues } from 'mysql2/promise';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { config } from '../config';
import { logger } from '../utils/logger';

interface DbCredentials {
  username: string;
  password: string;
  host: string;
  readerHost?: string;
  port: number;
  dbname: string;
}

/**
 * Dual-connection pool manager for RDS reader/writer endpoints.
 * - Writer pool: INSERT, UPDATE, DELETE
 * - Reader pool: SELECT queries
 */
class DatabaseManager {
  private writerPool: Pool | null = null;
  private readerPool: Pool | null = null;

  private async getCredentials(): Promise<DbCredentials> {
    if (config.isProduction) {
      const client = new SecretsManagerClient({ region: config.aws.region });
      const response = await client.send(
        new GetSecretValueCommand({ SecretId: config.db.secretName })
      );
      return JSON.parse(response.SecretString || '{}');
    }

    return {
      username: config.db.user,
      password: config.db.password,
      host: config.db.writerHost,
      readerHost: config.db.readerHost,
      port: config.db.port,
      dbname: config.db.name,
    };
  }

  private buildPoolOptions(credentials: DbCredentials, host: string): PoolOptions {
    return {
      host,
      port: credentials.port,
      user: credentials.username,
      password: credentials.password,
      database: credentials.dbname,
      waitForConnections: true,
      connectionLimit: config.db.poolMax,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      ...(config.aws.endpointUrl ? {} : { ssl: config.isProduction ? { rejectUnauthorized: true } : undefined }),
    };
  }

  async initialize(): Promise<void> {
    const credentials = await this.getCredentials();

    this.writerPool = mysql.createPool(
      this.buildPoolOptions(credentials, credentials.host)
    );

    this.readerPool = mysql.createPool(
      this.buildPoolOptions(credentials, credentials.readerHost || credentials.host)
    );

    // Verify connectivity
    const conn = await this.writerPool.getConnection();
    await conn.ping();
    conn.release();

    logger.info('Database pools initialized', {
      writer: credentials.host,
      reader: credentials.readerHost || credentials.host,
    });
  }

  /** Execute SELECT queries on the reader endpoint */
  async query<T extends RowDataPacket[]>(
    sql: string,
    params?: unknown[]
  ): Promise<T> {
    if (!this.readerPool) throw new Error('Database not initialized');
    const [rows] = await this.readerPool.query<T>(sql, params);
    return rows;
  }

  /** Execute INSERT/UPDATE/DELETE on the writer endpoint */
  async execute(sql: string, params?: unknown[]): Promise<ResultSetHeader> {
    if (!this.writerPool) throw new Error('Database not initialized');
    const [result] = await this.writerPool.execute<ResultSetHeader>(sql, params as ExecuteValues);
    return result;
  }

  /** Use writer pool for transactions that span multiple statements */
  async transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    if (!this.writerPool) throw new Error('Database not initialized');
    const connection = await this.writerPool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async close(): Promise<void> {
    await Promise.all([
      this.writerPool?.end(),
      this.readerPool?.end(),
    ]);
    logger.info('Database pools closed');
  }
}

export const db = new DatabaseManager();
