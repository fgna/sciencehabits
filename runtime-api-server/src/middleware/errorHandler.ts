/**
 * Error Handling Middleware
 * 
 * Centralized error handling with proper logging and user-friendly responses.
 */

import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metricsService';
import { config } from '../config';

export interface ErrorResponse {
  success: false;
  error: string;
  timestamp: string;
  requestId?: string;
  details?: any;
}

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Main error handling middleware
 */
export function errorHandler(
  error: Error | APIError,
  req: Request & { requestId?: string },
  res: Response,
  next: NextFunction
): void {
  const requestId = req.requestId || 'unknown';
  const timestamp = new Date().toISOString();

  // Determine status code
  let statusCode = 500;
  if (error instanceof APIError) {
    statusCode = error.statusCode;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
  }

  // Log error with appropriate level
  if (statusCode >= 500) {
    console.error(`💥 Server Error [${requestId}]:`, {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  } else if (statusCode >= 400) {
    console.warn(`⚠️ Client Error [${requestId}]:`, {
      error: error.message,
      path: req.path,
      method: req.method,
      statusCode
    });
  }

  // Record error metrics
  metricsService.recordEvent('error_occurred', {
    error: error.message,
    statusCode,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: getErrorMessage(error, statusCode),
    timestamp,
    requestId
  };

  // Include details in development mode
  if (config.isDevelopment && error instanceof APIError && error.details) {
    errorResponse.details = error.details;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: Error | APIError, statusCode: number): string {
  // Don't expose internal errors in production
  if (!config.isDevelopment && statusCode >= 500) {
    return 'Internal server error';
  }

  // Return specific error messages for client errors
  if (error instanceof APIError) {
    return error.message;
  }

  switch (statusCode) {
    case 400:
      return 'Bad request - please check your input';
    case 401:
      return 'Authentication required';
    case 403:
      return 'Access forbidden - insufficient permissions';
    case 404:
      return 'Resource not found';
    case 429:
      return 'Too many requests - please slow down';
    case 500:
    default:
      return config.isDevelopment ? error.message : 'Internal server error';
  }
}

/**
 * Not found handler (404 middleware)
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = new APIError(
    `Route not found: ${req.method} ${req.path}`,
    404,
    'ROUTE_NOT_FOUND'
  );
  
  next(error);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error handler
 */
export function validationErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error.name === 'ValidationError' || error.type === 'entity.parse.failed') {
    const apiError = new APIError(
      'Invalid request data',
      400,
      'VALIDATION_ERROR',
      config.isDevelopment ? error.details || error.message : undefined
    );
    
    next(apiError);
    return;
  }

  next(error);
}

/**
 * Rate limit error handler
 */
export function rateLimitErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error.status === 429) {
    const apiError = new APIError(
      'Too many requests - please slow down',
      429,
      'RATE_LIMIT_EXCEEDED',
      {
        retryAfter: error.retryAfter,
        limit: error.limit,
        remaining: error.remaining
      }
    );
    
    next(apiError);
    return;
  }

  next(error);
}

/**
 * Security error handler
 */
export function securityErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle various security-related errors
  if (error.code === 'EBADCSRFTOKEN') {
    const apiError = new APIError(
      'Invalid CSRF token',
      403,
      'CSRF_ERROR'
    );
    
    next(apiError);
    return;
  }

  if (error.status === 413) {
    const apiError = new APIError(
      'Request payload too large',
      413,
      'PAYLOAD_TOO_LARGE'
    );
    
    next(apiError);
    return;
  }

  next(error);
}