import { RowDataPacket } from 'mysql2';
import { db } from '../config/database';
import { BaseRepository } from './base.repository';
import { Department, QueryOptions } from '../types';

export class DepartmentRepository extends BaseRepository<Department & RowDataPacket> {
  protected tableName = 'departments';
  protected allowedSortColumns = ['id', 'name', 'created_at'];
  protected searchableColumns = ['name', 'description'];

  async findByIdWithDetails(id: number): Promise<(Department & RowDataPacket) | null> {
    const rows = await db.query<(Department & RowDataPacket)[]>(
      `SELECT d.*,
              CONCAT(e.first_name, ' ', e.last_name) as manager_name,
              (SELECT COUNT(*) FROM employees WHERE department_id = d.id) as employee_count
       FROM departments d
       LEFT JOIN employees e ON d.manager_id = e.id
       WHERE d.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findAllWithDetails(options: QueryOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const offset = (page - 1) * limit;

    const { clause, params } = this.buildWhereClause(options.filters, options.search);

    const [countResult] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM departments d ${clause}`,
      params
    );

    const data = await db.query<(Department & RowDataPacket)[]>(
      `SELECT d.*,
              CONCAT(e.first_name, ' ', e.last_name) as manager_name,
              (SELECT COUNT(*) FROM employees emp WHERE emp.department_id = d.id) as employee_count
       FROM departments d
       LEFT JOIN employees e ON d.manager_id = e.id
       ${clause}
       ORDER BY d.name ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data,
      pagination: {
        page,
        limit,
        total: countResult.total as number,
        totalPages: Math.ceil((countResult.total as number) / limit),
      },
    };
  }

  async create(data: Partial<Department>): Promise<number> {
    const result = await db.execute(
      `INSERT INTO departments (name, description, manager_id) VALUES (?, ?, ?)`,
      [data.name, data.description ?? null, data.manager_id ?? null]
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<Department>): Promise<boolean> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.manager_id !== undefined) { fields.push('manager_id = ?'); values.push(data.manager_id); }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await db.execute(
      `UPDATE departments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }
}

export const departmentRepository = new DepartmentRepository();
