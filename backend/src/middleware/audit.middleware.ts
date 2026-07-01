import { Request, Response, NextFunction } from 'express';
import { auditLogRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger';

/**
 * Factory for audit logging middleware.
 * Records CREATE/UPDATE/DELETE actions to the audit_logs table.
 */
export const auditLog = (action: string, entityType: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function (body: Record<string, unknown>) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        auditLogRepository
          .log({
            userId: req.user?.userId,
            action,
            entityType,
            entityId: req.params.id ? parseInt(req.params.id, 10) : (body.data as { id?: number })?.id,
            newValues: req.method !== 'DELETE' ? (req.body as Record<string, unknown>) : undefined,
            ipAddress: req.auditMeta?.ipAddress,
            userAgent: req.auditMeta?.userAgent,
          })
          .catch((err) => logger.error('Audit log failed', { error: err.message }));
      }
      return originalJson(body);
    };

    next();
  };
};
