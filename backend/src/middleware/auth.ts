import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

// Extend FastifyRequest to include user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

export const JWT_ACCESS_EXPIRY = '15m'; // 15 minutes
export const JWT_REFRESH_EXPIRY = '7d'; // 7 days

/**
 * Middleware to verify JWT access token
 * Attaches user info to request.user if valid
 */
export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return reply.status(401).send({
        success: false,
        error: 'Access token required',
        statusCode: 401
      });
    }

    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    request.user = payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return reply.status(401).send({
        success: false,
        error: 'Access token expired',
        statusCode: 401
      });
    }

    return reply.status(403).send({
      success: false,
      error: 'Invalid access token',
      statusCode: 403
    });
  }
}

/**
 * Middleware to verify user has admin role
 * Must be used after authenticateToken
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.user) {
    return reply.status(401).send({
      success: false,
      error: 'Authentication required',
      statusCode: 401
    });
  }

  if (request.user.role !== 'admin') {
    return reply.status(403).send({
      success: false,
      error: 'Admin access required',
      statusCode: 403
    });
  }
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: { userId: number; tokenId: number }): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): { userId: number; tokenId: number } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: number; tokenId: number };
}

/**
 * Optional authentication - attaches user if token is valid, but doesn't require it
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
      request.user = payload;
    }
  } catch (error) {
    // Silently fail for optional auth
  }
}
