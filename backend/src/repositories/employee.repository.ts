import { RowDataPacket } from 'mysql2';
import { db } from '../config/database';
import { BaseRepository } from './base.repository';
import { Employee, EmployeeStatus, QueryOptions } from '../types';

export class EmployeeRepository extends BaseRepository<Employee & RowDataPacket> {
  protected tableName = 'employees';
  protected allowedSortColumns = [
    'id', 'first_name', 'last_name', 'email', 'hire_date', 'salary', 'status', 'created_at',
  ];
  protected searchableColumns = ['first_name', 'last_name', 'email', 'employee_code', 'position'];

  async findByIdWithDepartment(id: number): Promise<(Employee & RowDataPacket) | null> {
    const rows = await db.query<(Employee & RowDataPacket)[]>(
      `SELECT e.*, d.name as department_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findAllWithDepartment(options: QueryOptions = {}) {
    const base = await this.findAll(options);
    const ids = base.data.map((e) => e.id);
    if (ids.length === 0) return base;

    const enriched = await db.query<(Employee & RowDataPacket)[]>(
      `SELECT e.*, d.name as department_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.id IN (${ids.map(() => '?').join(',')})
       ORDER BY FIELD(e.id, ${ids.map(() => '?').join(',')})`,
      [...ids, ...ids]
    );

    return { ...base, data: enriched };
  }

  async create(data: Partial<Employee>): Promise<number> {
    const result = await db.execute(
      `INSERT INTO employees
       (user_id, employee_code, first_name, last_name, email, phone, department_id,
        position, hire_date, salary, status, address, date_of_birth, emergency_contact)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id ?? null,
        data.employee_code,
        data.first_name,
        data.last_name,
        data.email,
        data.phone ?? null,
        data.department_id ?? null,
        data.position ?? null,
        data.hire_date,
        data.salary ?? null,
        data.status ?? 'active',
        data.address ?? null,
        data.date_of_birth ?? null,
        data.emergency_contact ?? null,
      ]
    );
    return result.insertId;
  }

  async update(id: number, data: Partial<Employee>): Promise<boolean> {
    const fields: string[] = [];
    const values: unknown[] = [];

    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone', 'department_id', 'position',
      'hire_date', 'salary', 'status', 'profile_picture_key', 'address',
      'date_of_birth', 'emergency_contact',
    ] as const;

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) return false;

    values.push(id);
    const result = await db.execute(
      `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  async countByStatus(): Promise<Record<EmployeeStatus, number>> {
    const rows = await db.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) as count FROM employees GROUP BY status`
    );
    const result = { active: 0, inactive: 0, terminated: 0, on_leave: 0 } as Record<EmployeeStatus, number>;
    rows.forEach((row) => {
      result[row.status as EmployeeStatus] = row.count;
    });
    return result;
  }

  async countByDepartment(): Promise<{ department: string; count: number }[]> {
    return db.query<RowDataPacket[]>(
      `SELECT COALESCE(d.name, 'Unassigned') as department, COUNT(e.id) as count
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       GROUP BY d.name
       ORDER BY count DESC`
    ) as Promise<{ department: string; count: number }[]>;
  }
}

export const employeeRepository = new EmployeeRepository();
