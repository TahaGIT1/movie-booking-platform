import { AppError } from './error.middleware.js';

export const enforceTenantScope = (req, res, next) => {
  if (!req.user) {
    return next(new AppError(401, 'Not authenticated', 'UNAUTHORIZED'));
  }

  // Super admins don't need tenant isolation
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  if (!req.user.theatreId) {
    return next(new AppError(403, 'User is not assigned to any theatre', 'NO_TENANT'));
  }

  // Assign the theatreId to the request for easy filtering in controllers
  req.tenantId = req.user.theatreId;

  // If a theatreId is provided in params/body, validate it
  const resourceTheatreId = req.params.theatreId || req.body.theatreId;
  
  if (resourceTheatreId && resourceTheatreId !== req.user.theatreId) {
    return next(new AppError(403, 'Cross-tenant access forbidden', 'CROSS_TENANT_VIOLATION'));
  }

  next();
};
