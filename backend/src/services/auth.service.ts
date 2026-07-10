import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { userRepository } from '../repositories/user.repository';
import { auditLogRepository } from '../repositories/user.repository';
import { UnauthorizedError } from '../utils/errors';
import { JwtPayload } from '../types';

const SALT_ROUNDS = 12;

// hello

export class AuthService {
  async login(
    email: string,
    password: string,
    meta?: { ipAddress?: string; userAgent?: string }
  ) {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.is_active) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    await userRepository.updateLastLogin(user.id);

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const signOptions: SignOptions = {
      expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
    };
    const token = jwt.sign(payload, config.jwt.secret, signOptions);

    await auditLogRepository.log({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'user',
      entityId: user.id,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async register(email: string, password: string, role = 'employee') {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new UnauthorizedError('Email already registered');
    }

    const passwordHash = await this.hashPassword(password);
    const userId = await userRepository.create(email, passwordHash, role);

    return { id: userId, email, role };
  }
}

export const authService = new AuthService();
