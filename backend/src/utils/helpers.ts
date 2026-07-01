import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from './errors';
import { logger } from './logger';

/** Run express-validator chains and return first validation error */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map((v) => v.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const message = errors.array().map((e) => e.msg).join(', ');
      next(new AppError(400, message));
      return;
    }
    next();
  };
};

/** Central error handler — operational errors return JSON; unexpected errors log and return 500 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // CSRF token errors
  if (err.message === 'invalid csrf token') {
    res.status(403).json({ success: false, message: 'Invalid CSRF token' });
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

/** Standard paginated response envelope */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const buildPagination = (
  page: number,
  limit: number,
  total: number
): PaginatedResult<never>['pagination'] => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
