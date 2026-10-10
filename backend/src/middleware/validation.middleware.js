import { ZodError } from 'zod';
import { AppError } from './error.middleware.js';

export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new AppError(400, 'Validation failed', 'VALIDATION_ERROR', error.errors));
      }
      return next(error);
    }
  };
};
