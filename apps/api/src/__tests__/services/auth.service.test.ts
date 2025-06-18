import { AuthService } from '../../services/auth.service';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(),
    end: jest.fn(),
  })),
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;
  let mockPool: any;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
    mockPool = new Pool();
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword';
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await authService.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12); // Default rounds
      expect(result).toBe(hashedPassword);
    });
  });

  describe('comparePassword', () => {
    it('should return true for valid password', async () => {
      const password = 'testPassword123';
      const hash = 'hashedPassword';
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.comparePassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for invalid password', async () => {
      const password = 'wrongPassword';
      const hash = 'hashedPassword';
      
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.comparePassword(password, hash);

      expect(result).toBe(false);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'user'
      };
      
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce('accessToken')
        .mockReturnValueOnce('refreshToken');

      const tokens = authService.generateTokens(payload);

      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(tokens).toEqual({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken'
      });
    });
  });

  describe('verifyAccessToken', () => {
    it('should return payload for valid token', () => {
      const token = 'validToken';
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'user'
      };
      
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const result = authService.verifyAccessToken(token);

      expect(jwt.verify).toHaveBeenCalledWith(token, expect.any(String));
      expect(result).toEqual(payload);
    });

    it('should return null for invalid token', () => {
      const token = 'invalidToken';
      
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = authService.verifyAccessToken(token);

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const name = 'Test User';
      const hashedPassword = 'hashedPassword';
      
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      
      const mockUser = {
        id: '123',
        email,
        name,
        role: 'user'
      };
      
      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await authService.createUser(email, password, name);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [email, hashedPassword, name, 'user']
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: '123',
        email,
        name: 'Test User',
        password: 'hashedPassword',
        role: 'user'
      };
      
      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      const result = await authService.findUserByEmail(email);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [email]
      );
      expect(result).toEqual(mockUser);
    });

    it('should return undefined when user not found', async () => {
      const email = 'notfound@example.com';
      
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await authService.findUserByEmail(email);

      expect(result).toBeUndefined();
    });
  });

  describe('saveRefreshToken', () => {
    it('should save refresh token', async () => {
      const userId = '123';
      const token = 'refreshToken';
      
      mockPool.query.mockResolvedValue({ rows: [] });

      await authService.saveRefreshToken(userId, token);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO refresh_tokens'),
        [userId, token, expect.any(Date)]
      );
    });
  });

  describe('validateRefreshToken', () => {
    it('should return true for valid refresh token', async () => {
      const userId = '123';
      const token = 'validRefreshToken';
      
      mockPool.query.mockResolvedValue({ rows: [{ token }] });

      const result = await authService.validateRefreshToken(userId, token);

      expect(result).toBe(true);
    });

    it('should return false for invalid refresh token', async () => {
      const userId = '123';
      const token = 'invalidRefreshToken';
      
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await authService.validateRefreshToken(userId, token);

      expect(result).toBe(false);
    });
  });
});