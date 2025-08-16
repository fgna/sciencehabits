/**
 * Authentication Middleware
 * 
 * Simple but secure authentication for admin endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    permissions: string[];
  };
}

/**
 * Authentication middleware for admin endpoints
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Authorization header required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Support both Bearer token and API key formats
    let token: string;
    
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (authHeader.startsWith('ApiKey ')) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }

    // For now, use simple API key authentication
    // In production, this could be enhanced with JWT tokens
    if (token !== config.adminApiKey) {
      res.status(401).json({
        success: false,
        error: 'Invalid authentication credentials',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Set user context for admin
    req.user = {
      id: 'admin',
      role: 'administrator',
      permissions: ['read', 'write', 'admin']
    };

    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Optional authentication middleware (allows both authenticated and anonymous access)
 */
export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      // Try to authenticate, but don't fail if invalid
      let token: string;
      
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (authHeader.startsWith('ApiKey ')) {
        token = authHeader.substring(7);
      } else {
        token = authHeader;
      }

      if (token === config.adminApiKey) {
        req.user = {
          id: 'admin',
          role: 'administrator',
          permissions: ['read', 'write', 'admin']
        };
      }
    }

    // Always proceed, regardless of authentication status
    next();

  } catch (error) {
    console.error('Optional authentication error:', error);
    // Still proceed on error
    next();
  }
}

/**
 * Permission check middleware factory
 */
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({
        success: false,
        error: `Permission '${permission}' required`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  };
}