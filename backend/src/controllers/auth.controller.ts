import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { NotFoundError } from '../utils/errors';
import { userRepository } from '../repositories/user.repository';

export class AuthController {
  /** POST /auth/login */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password, req.auditMeta);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  /** GET /auth/me */
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userRepository.findByEmail(req.user!.email);
      if (!user) throw new NotFoundError('User');

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          lastLogin: user.last_login,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
