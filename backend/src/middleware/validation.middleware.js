import { ZodError } from 'zod';
import { AppError } from './error.middleware.js';

export const validateRequest = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      if (schema?.shape && (schema.shape.body || schema.shape.query || schema.shape.params)) {
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
      } else {
        if (source === 'body') {
          req.body = await schema.parseAsync(req.body);
        } else if (source === 'query') {
          req.query = await schema.parseAsync(req.query);
        } else if (source === 'params') {
          req.params = await schema.parseAsync(req.params);
        }
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new AppError(400, error.errors[0]?.message || 'Validation failed', 'VALIDATION_ERROR', error.errors));
      }
      return next(error);
    }
  };
};
