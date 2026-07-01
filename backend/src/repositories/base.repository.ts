import { RowDataPacket } from 'mysql2';
import { db } from '../config/database';
import { QueryOptions } from '../types';
import { buildPagination, PaginatedResult } from '../utils/helpers';

/** Base repository with shared pagination, sorting, and filtering utilities */
export abstract class BaseRepository<T extends RowDataPacket> {
  protected abstract tableName: string;
  protected abstract allowedSortColumns: string[];
  protected abstract searchableColumns: string[];

  protected buildWhereClause(
    filters?: Record<string, string | number>,
    search?: string
  ): { clause: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== '') {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
      }
    }

    if (search && this.searchableColumns.length > 0) {
      const searchConditions = this.searchableColumns.map((col) => `${col} LIKE ?`);
      conditions.push(`(${searchConditions.join(' OR ')})`);
      const searchTerm = `%${search}%`;
      this.searchableColumns.forEach(() => params.push(searchTerm));
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { clause, params };
  }

  protected getSortClause(sortBy?: string, sortOrder: 'asc' | 'desc' = 'asc'): string {
    const column = sortBy && this.allowedSortColumns.includes(sortBy)
      ? sortBy
      : 'id';
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';
    return `ORDER BY ${column} ${order}`;
  }

  async findById(id: number): Promise<T | null> {
    const rows = await db.query<T[]>(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const offset = (page - 1) * limit;

    const { clause, params } = this.buildWhereClause(options.filters, options.search);
    const sortClause = this.getSortClause(options.sortBy, options.sortOrder);

    const [countResult] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM ${this.tableName} ${clause}`,
      params
    );
    const total = countResult.total as number;

    const data = await db.query<T[]>(
      `SELECT * FROM ${this.tableName} ${clause} ${sortClause} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data,
      pagination: buildPagination(page, limit, total),
    };
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.execute(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }
}
