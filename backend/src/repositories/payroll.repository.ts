import { RowDataPacket } from 'mysql2';
import { db } from '../config/database';
import { BaseRepository } from './base.repository';
import { Payroll, QueryOptions } from '../types';

export class PayrollRepository extends BaseRepository<Payroll & RowDataPacket> {
  protected tableName = 'payroll';
  protected allowedSortColumns = ['id', 'pay_period_start', 'net_pay', 'status', 'created_at'];
  protected searchableColumns = [];

  async findAllWithEmployee(options: QueryOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 10));
    const offset = (page - 1) * limit;
    const filters = options.filters || {};

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.employee_id) { conditions.push('p.employee_id = ?'); params.push(filters.employee_id); }
    if (filters.status) { conditions.push('p.status = ?'); params.push(filters.status); }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM payroll p ${clause}`,
      params
    );

    const data = await db.query<(Payroll & RowDataPacket)[]>(
      `SELECT p.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name
       FROM payroll p
       JOIN employees e ON p.employee_id = e.id
       ${clause}
       ORDER BY p.pay_period_start DESC
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

  async create(data: Partial<Payroll>): Promise<number> {
    const netPay =
      (data.base_salary || 0) +
      (data.bonuses || 0) -
      (data.deductions || 0) -
      (data.tax || 0);

    const result = await db.execute(
      `INSERT INTO payroll
       (employee_id, pay_period_start, pay_period_end, base_salary, bonuses,
        deductions, tax, net_pay, status, payment_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.employee_id,
        data.pay_period_start,
        data.pay_period_end,
        data.base_salary,
        data.bonuses ?? 0,
        data.deductions ?? 0,
        data.tax ?? 0,
        netPay,
        data.status ?? 'draft',
        data.payment_date ?? null,
        data.notes ?? null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<Payroll>): Promise<boolean> {
    const fields: string[] = [];
    const values: unknown[] = [];

    const allowed = ['base_salary', 'bonuses', 'deductions', 'tax', 'status', 'payment_date', 'notes'] as const;
    for (const field of allowed) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) return false;

    // Recalculate net_pay if salary components changed
    if (data.base_salary !== undefined || data.bonuses !== undefined ||
        data.deductions !== undefined || data.tax !== undefined) {
      const existing = await this.findById(id);
      if (existing) {
        const netPay =
          (data.base_salary ?? existing.base_salary) +
          (data.bonuses ?? existing.bonuses) -
          (data.deductions ?? existing.deductions) -
          (data.tax ?? existing.tax);
        fields.push('net_pay = ?');
        values.push(netPay);
      }
    }

    values.push(id);
    const result = await db.execute(
      `UPDATE payroll SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async getMonthlyTotals(): Promise<{ month: string; total: number }[]> {
    return db.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(pay_period_start, '%Y-%m') as month, SUM(net_pay) as total
       FROM payroll
       WHERE status IN ('processed', 'paid')
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`
    ) as Promise<{ month: string; total: number }[]>;
  }
}

export const payrollRepository = new PayrollRepository();
