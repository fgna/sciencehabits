/**
 * Logging Middleware
 * 
 * Request/response logging with performance tracking.
 */

import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metricsService';
import { config } from '../config';

export interface LoggedRequest extends Request {
  startTime?: number;
  requestId?: string;
}

/**
 * Generate a simple request ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Get client IP address
 */
function getClientIP(req: Request): string {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * Logging middleware
 */
export function loggingMiddleware(
  req: LoggedRequest,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  req.startTime = startTime;
  req.requestId = requestId;

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  // Log request start (in development only)
  if (config.isDevelopment) {
    console.log(`📨 ${req.method} ${req.path} [${requestId}] - ${getClientIP(req)}`);
  }

  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    const contentLength = res.getHeader('content-length') || chunk?.length || 0;
    const userAgent = req.get('User-Agent') || 'unknown';
    const clientIP = getClientIP(req);

    // Determine source based on response headers or status
    let source: 'cache' | 'github_pages' | 'error' | 'validation_error' | 'not_found' | 'server_error';
    
    if (statusCode === 404) {
      source = 'not_found';
    } else if (statusCode >= 500) {
      source = 'server_error';
    } else if (statusCode === 400) {
      source = 'validation_error';
    } else if (res.getHeader('X-Cache-Hit')) {
      source = 'cache';
    } else {
      source = 'github_pages';
    }

    // Record metrics
    metricsService.recordRequest(
      req.path,
      statusCode,
      source,
      responseTime,
      req.method,
      userAgent,
      clientIP
    );

    // Log response
    const logLevel = statusCode >= 500 ? '❌' : statusCode >= 400 ? '⚠️' : '✅';
    const logMessage = `${logLevel} ${req.method} ${req.path} [${requestId}] - ${statusCode} ${responseTime}ms ${contentLength}b`;
    
    if (config.isDevelopment || statusCode >= 400) {
      console.log(logMessage);
    }

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
}

/**
 * Error logging middleware
 */
export function errorLoggingMiddleware(
  error: Error,
  req: LoggedRequest,
  res: Response,
  next: NextFunction
): void {
  const responseTime = req.startTime ? Date.now() - req.startTime : 0;
  const requestId = req.requestId || 'unknown';
  
  console.error(`💥 Error [${requestId}] ${req.method} ${req.path}:`, {
    error: error.message,
    stack: error.stack,
    responseTime,
    userAgent: req.get('User-Agent'),
    ip: getClientIP(req)
  });

  // Record error metrics
  metricsService.recordRequest(
    req.path,
    500,
    'server_error',
    responseTime,
    req.method,
    req.get('User-Agent'),
    getClientIP(req)
  );

  next(error);
}