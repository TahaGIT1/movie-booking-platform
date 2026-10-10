import { AppError } from './error.middleware.js';
import { prisma } from '../config/prisma.js';

export const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated', 'UNAUTHORIZED');
      }

      // Check if user is SUPER_ADMIN or has global override
      if (req.user.role === 'SUPER_ADMIN') return next();

      const overrideCheck = await prisma.rolePermission.findFirst({
        where: { role: req.user.role, permission: 'GLOBAL_OVERRIDE' }
      });
      if (overrideCheck) return next();

      const permissionWhere = Array.isArray(requiredPermission)
        ? { in: requiredPermission }
        : requiredPermission;

      const permissionCheck = await prisma.rolePermission.findFirst({
        where: { role: req.user.role, permission: permissionWhere }
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
