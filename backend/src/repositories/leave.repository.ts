import { RowDataPacket } from 'mysql2';
import { db } from '../config/database';
import { BaseRepository } from './base.repository';
import { LeaveRequest, QueryOptions } from '../types';

export class LeaveRepository extends BaseRepository<LeaveRequest & RowDataPacket> {
  protected tableName = 'leave_requests';
  protected allowedSortColumns = ['id', 'start_date', 'end_date', 'status', 'created_at'];
  protected searchableColumns = ['reason'];

  async findAllWithDetails(options: QueryOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const offset = (page - 1) * limit;
    const filters = options.filters || {};

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.employee_id) { conditions.push('lr.employee_id = ?'); params.push(filters.employee_id); }
    if (filters.status) { conditions.push('lr.status = ?'); params.push(filters.status); }
    if (filters.leave_type) { conditions.push('lr.leave_type = ?'); params.push(filters.leave_type); }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM leave_requests lr ${clause}`,
      params
    );

    const data = await db.query<(LeaveRequest & RowDataPacket)[]>(
      `SELECT lr.*,
              CONCAT(e.first_name, ' ', e.last_name) as employee_name,
              u.email as approver_name
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       LEFT JOIN users u ON lr.approved_by = u.id
       ${clause}
       ORDER BY lr.created_at DESC
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

  async create(data: Partial<LeaveRequest>): Promise<number> {
    const result = await db.execute(
      `INSERT INTO leave_requests
       (employee_id, leave_type, start_date, end_date, days_requested, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.employee_id,
        data.leave_type,
        data.start_date,
        data.end_date,
        data.days_requested,
        data.reason ?? null,
        data.status ?? 'pending',
      ]
    );
    return result.insertId;
  }

  async updateStatus(
    id: number,
    status: string,
    approvedBy: number,
    rejectionReason?: string
  ): Promise<boolean> {
    const result = await db.execute(
      `UPDATE leave_requests
       SET status = ?, approved_by = ?, approved_at = NOW(), rejection_reason = ?
       WHERE id = ?`,
      [status, approvedBy, rejectionReason ?? null, id]
    );
    return result.affectedRows > 0;
  }

  async countByStatus(): Promise<{ status: string; count: number }[]> {
    return db.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) as count FROM leave_requests GROUP BY status`
    ) as Promise<{ status: string; count: number }[]>;
  }
}

export const leaveRepository = new LeaveRepository();
