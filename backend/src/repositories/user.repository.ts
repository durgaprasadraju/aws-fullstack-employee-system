import { RowDataPacket } from 'mysql2';
import { db } from '../config/database';
import { BaseRepository } from './base.repository';
import { User, AuditLog, QueryOptions } from '../types';

export class UserRepository extends BaseRepository<User & RowDataPacket> {
  protected tableName = 'users';
  protected allowedSortColumns = ['id', 'email', 'role', 'created_at'];
  protected searchableColumns = ['email'];

  async findByEmail(email: string): Promise<(User & RowDataPacket) | null> {
    const rows = await db.query<(User & RowDataPacket)[]>(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );
    return rows[0] || null;
  }

  async updateLastLogin(id: number): Promise<void> {
    await db.execute(`UPDATE users SET last_login = NOW() WHERE id = ?`, [id]);
  }

  async create(email: string, passwordHash: string, role: string): Promise<number> {
    const result = await db.execute(
      `INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)`,
      [email, passwordHash, role]
    );
    return result.insertId;
  }
}

export class AuditLogRepository extends BaseRepository<AuditLog & RowDataPacket> {
  protected tableName = 'audit_logs';
  protected allowedSortColumns = ['id', 'action', 'entity_type', 'created_at'];
  protected searchableColumns = ['action', 'entity_type'];

  async findAllWithUser(options: QueryOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const [countResult] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM audit_logs`
    );

    const data = await db.query<(AuditLog & RowDataPacket)[]>(
      `SELECT al.*, u.email as user_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
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

  async log(entry: {
    userId?: number;
    action: string;
    entityType: string;
    entityId?: number;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await db.execute(
      `INSERT INTO audit_logs
       (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.userId ?? null,
        entry.action,
        entry.entityType,
        entry.entityId ?? null,
        entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        entry.newValues ? JSON.stringify(entry.newValues) : null,
        entry.ipAddress ?? null,
        entry.userAgent ?? null,
      ]
    );
  }
}

export const userRepository = new UserRepository();
export const auditLogRepository = new AuditLogRepository();
