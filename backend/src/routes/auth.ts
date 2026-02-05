import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { db } from '../db/index.js';
import {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  AuthResponse,
  User
} from '../types';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  authenticateToken
} from '../middleware/auth.js';

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/auth/register
   * Register a new user account
   */
  fastify.post<{ Body: RegisterRequest }>('/auth/register', async (request, reply) => {
    try {
      const { email, password, full_name } = request.body;

      // Validate input
      if (!email || !password) {
        return reply.status(400).send({
          success: false,
          error: 'Email and password are required',
          statusCode: 400
        });
      }

      if (password.length < 6) {
        return reply.status(400).send({
          success: false,
          error: 'Password must be at least 6 characters',
          statusCode: 400
        });
      }

      // Check if user already exists
      const [existingUsers] = await db.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return reply.status(409).send({
          success: false,
          error: 'User with this email already exists',
          statusCode: 409
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create user
      const [result] = await db.query<ResultSetHeader>(
        'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
        [email, password_hash, full_name || null, 'user']
      );

      const userId = result.insertId;

      // Create refresh token
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

      const [tokenResult] = await db.query<ResultSetHeader>(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, 'temp', refreshTokenExpiry]
      );

      const tokenId = tokenResult.insertId;

      // Generate tokens
      const accessToken = generateAccessToken({
        userId,
        email,
        role: 'user'
      });

      const refreshToken = generateRefreshToken({ userId, tokenId });

      // Update refresh token with actual token
      await db.query(
        'UPDATE refresh_tokens SET token = ? WHERE id = ?',
        [refreshToken, tokenId]
      );

      const response: AuthResponse = {
        user: {
          id: userId,
          email,
          full_name: full_name || null,
          role: 'user'
        },
        accessToken,
        refreshToken
      };

      return reply.status(201).send({
        success: true,
        data: response
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to register user',
        statusCode: 500
      });
    }
  });

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  fastify.post<{ Body: LoginRequest }>('/auth/login', async (request, reply) => {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.status(400).send({
          success: false,
          error: 'Email and password are required',
          statusCode: 400
        });
      }

      // Find user
      const [users] = await db.query<RowDataPacket[]>(
        'SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid email or password',
          statusCode: 401
        });
      }

      const user = users[0] as User;

      // Check if account is active
      if (!user.is_active) {
        return reply.status(403).send({
          success: false,
          error: 'Account is disabled',
          statusCode: 403
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid email or password',
          statusCode: 401
        });
      }

      // Update last login
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [user.id]
      );

      // Create refresh token
      const refreshTokenExpiry = new Date();
      refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

      const [tokenResult] = await db.query<ResultSetHeader>(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, 'temp', refreshTokenExpiry]
      );

      const tokenId = tokenResult.insertId;

      // Generate tokens
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      const refreshToken = generateRefreshToken({ userId: user.id, tokenId });

      // Update refresh token with actual token
      await db.query(
        'UPDATE refresh_tokens SET token = ? WHERE id = ?',
        [refreshToken, tokenId]
      );

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        },
        accessToken,
        refreshToken
      };

      return reply.send({
        success: true,
        data: response
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to login',
        statusCode: 500
      });
    }
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  fastify.post<{ Body: RefreshTokenRequest }>('/auth/refresh', async (request, reply) => {
    try {
      const { refreshToken } = request.body;

      if (!refreshToken) {
        return reply.status(400).send({
          success: false,
          error: 'Refresh token is required',
          statusCode: 400
        });
      }

      // Verify refresh token
      let payload: { userId: number; tokenId: number };
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch (error) {
        return reply.status(401).send({
          success: false,
          error: 'Invalid or expired refresh token',
          statusCode: 401
        });
      }

      // Check if token exists and is valid
      const [tokens] = await db.query<RowDataPacket[]>(
        'SELECT * FROM refresh_tokens WHERE id = ? AND user_id = ? AND token = ? AND expires_at > NOW()',
        [payload.tokenId, payload.userId, refreshToken]
      );

      if (tokens.length === 0) {
        return reply.status(401).send({
          success: false,
          error: 'Refresh token has been revoked or expired',
          statusCode: 401
        });
      }

      // Get user info
      const [users] = await db.query<RowDataPacket[]>(
        'SELECT id, email, full_name, role, is_active FROM users WHERE id = ?',
        [payload.userId]
      );

      if (users.length === 0 || !users[0].is_active) {
        return reply.status(401).send({
          success: false,
          error: 'User not found or inactive',
          statusCode: 401
        });
      }

      const user = users[0] as User;

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return reply.send({
        success: true,
        data: {
          accessToken,
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
          }
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to refresh token',
        statusCode: 500
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout and invalidate refresh token
   */
  fastify.post<{ Body: RefreshTokenRequest }>('/auth/logout', async (request, reply) => {
    try {
      const { refreshToken } = request.body;

      if (!refreshToken) {
        return reply.status(400).send({
          success: false,
          error: 'Refresh token is required',
          statusCode: 400
        });
      }

      // Delete refresh token
      await db.query(
        'DELETE FROM refresh_tokens WHERE token = ?',
        [refreshToken]
      );

      return reply.send({
        success: true,
        data: { message: 'Logged out successfully' }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to logout',
        statusCode: 500
      });
    }
  });

  /**
   * GET /api/auth/me
   * Get current user information
   */
  fastify.get('/auth/me', {
    preHandler: authenticateToken
  }, async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: 'Not authenticated',
          statusCode: 401
        });
      }

      // Get full user info from database
      const [users] = await db.query<RowDataPacket[]>(
        'SELECT id, email, full_name, role, created_at, last_login FROM users WHERE id = ?',
        [request.user.userId]
      );

      if (users.length === 0) {
        return reply.status(404).send({
          success: false,
          error: 'User not found',
          statusCode: 404
        });
      }

      const user = users[0];

      return reply.send({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          created_at: user.created_at,
          last_login: user.last_login
        }
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to get user info',
        statusCode: 500
      });
    }
  });
}
