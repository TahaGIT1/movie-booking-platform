import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(statusCode, message, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
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
