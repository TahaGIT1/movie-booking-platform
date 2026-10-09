import { AppError } from './error.middleware.js';
import { prisma } from '../config/prisma.js';

export const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated', 'UNAUTHORIZED');
      }

      // Check if user has global override
      const overrideCheck = await prisma.rolePermission.findFirst({
        where: { role: req.user.role, permission: 'GLOBAL_OVERRIDE' }
      });
      if (overrideCheck) return next();

      const permissionCheck = await prisma.rolePermission.findFirst({
        where: { role: req.user.role, permission: requiredPermission }
      });

      if (!permissionCheck) {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
