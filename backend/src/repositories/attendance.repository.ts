import { RowDataPacket } from 'mysql2';
import { db } from '../config/database';
import { BaseRepository } from './base.repository';
import { Attendance, QueryOptions } from '../types';

export class AttendanceRepository extends BaseRepository<Attendance & RowDataPacket> {
  protected tableName = 'attendance';
  protected allowedSortColumns = ['id', 'date', 'status', 'created_at'];
  protected searchableColumns = [];

  async findAllWithEmployee(options: QueryOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const offset = (page - 1) * limit;
    const filters = options.filters || {};

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.employee_id) {
      conditions.push('a.employee_id = ?');
      params.push(filters.employee_id);
    }
    if (filters.status) {
      conditions.push('a.status = ?');
      params.push(filters.status);
    }
    if (filters.date) {
      conditions.push('a.date = ?');
      params.push(filters.date);
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM attendance a ${clause}`,
      params
    );

    const data = await db.query<(Attendance & RowDataPacket)[]>(
      `SELECT a.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       ${clause}
       ORDER BY a.date DESC
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

  async create(data: Partial<Attendance>): Promise<number> {
    const result = await db.execute(
      `INSERT INTO attendance (employee_id, date, check_in, check_out, status, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.employee_id,
        data.date,
        data.check_in ?? null,
        data.check_out ?? null,
        data.status ?? 'present',
        data.notes ?? null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<Attendance>): Promise<boolean> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.check_in !== undefined) { fields.push('check_in = ?'); values.push(data.check_in); }
    if (data.check_out !== undefined) { fields.push('check_out = ?'); values.push(data.check_out); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await db.execute(
      `UPDATE attendance SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async getTodaySummary(): Promise<{ status: string; count: number }[]> {
    return db.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) as count FROM attendance WHERE date = CURDATE() GROUP BY status`
    ) as Promise<{ status: string; count: number }[]>;
  }
}

export const attendanceRepository = new AttendanceRepository();
