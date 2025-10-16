import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';
import { env } from '../config/env';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: env.NODE_ENV === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle known API errors
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      details: error.details,
    });
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: 'Resource already exists',
        details: prismaError.meta,
      });
      return;
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Resource not found',
      });
      return;
    }
  }

  // Handle validation errors from Zod or other libraries
  if (error.name === 'ZodError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: (error as any).errors,
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    stack: env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};

/**
 * 404 handler for unknown routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
};

