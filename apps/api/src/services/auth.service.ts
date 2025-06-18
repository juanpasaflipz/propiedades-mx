import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { env } from '../config/env';
import { Logger } from '../utils/logger';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  constructor(
    private pool: Pool,
    private logger: Logger
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, env.BCRYPT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(
      payload,
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      payload,
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  async saveRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (user_id) 
       DO UPDATE SET token = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP`,
      [userId, token, expiresAt]
    );
  }

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT token FROM refresh_tokens WHERE user_id = $1 AND token = $2 AND expires_at > NOW()',
      [userId, token]
    );

    return result.rows.length > 0;
  }

  async revokeRefreshToken(userId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [userId]
    );
  }

  async createUser(email: string, password: string, name?: string): Promise<any> {
    const hashedPassword = await this.hashPassword(password);
    
    const result = await this.pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, hashedPassword, name || null, 'user']
    );

    return result.rows[0];
  }

  async findUserByEmail(email: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT id, email, name, password, role FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0];
  }

  async findUserById(id: string): Promise<any> {
    const result = await this.pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0];
  }

  async userExists(email: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    return result.rows.length > 0;
  }
}