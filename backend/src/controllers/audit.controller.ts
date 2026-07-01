import { Request, Response, NextFunction } from 'express';
import { auditLogRepository } from '../repositories/user.repository';

export class AuditController {
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query;
      const result = await auditLogRepository.findAllWithUser({
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };
}

export const auditController = new AuditController();
