import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(statusCode: number, message: string, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';
  const code = err.code || 'INTERNAL_ERROR';
  const details = err.details || null;

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
