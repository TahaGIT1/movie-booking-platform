import { ZodError } from 'zod';
import { AppError } from './error.middleware.js';

export const validateRequest = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      if (source === 'body') {
        req.body = await schema.parseAsync(req.body);
      } else if (source === 'query') {
        req.query = await schema.parseAsync(req.query);
      } else if (source === 'params') {
        req.params = await schema.parseAsync(req.params);
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new AppError(400, 'Validation failed', 'VALIDATION_ERROR', error.errors));
      }
      return next(error);
    }
  };
};
