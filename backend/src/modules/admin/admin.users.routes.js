import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { authenticate } from '../../middleware/auth.middleware.js';
import { AppError } from '../../middleware/error.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { prisma } from '../../config/prisma.js';

const router = Router();

// Platform administration is intentionally a hard role boundary. Theatre
// permissions and GLOBAL_OVERRIDE rows cannot grant access to this API.
router.use(authenticate, (req, _res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') {
    return next(new AppError(403, 'Platform administrator access required', 'FORBIDDEN'));
  }
  next();
});

const listSchema = z.object({
  query: z.object({
    q: z.string().trim().max(100).optional(),
    role: z.enum(['CUSTOMER', 'THEATRE_MANAGER', 'THEATRE_STAFF', 'SUPER_ADMIN']).optional(),
    theatreId: z.string().uuid().optional(),
    blocked: z.enum(['true', 'false']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25)
  })
});

const updateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    role: z.enum(['CUSTOMER', 'THEATRE_MANAGER', 'THEATRE_STAFF']).optional(),
    theatreId: z.string().uuid().nullable().optional(),
    isBlocked: z.boolean().optional()
  }).refine((value) => Object.keys(value).length > 0, 'At least one field is required')
}).refine(({ body }) => {
  const role = body.role;
  const hasTheatre = Object.hasOwn(body, 'theatreId');
  if (role === 'CUSTOMER' && hasTheatre && body.theatreId !== null) return false;
  if ((role === 'THEATRE_MANAGER' || role === 'THEATRE_STAFF') && hasTheatre && !body.theatreId) return false;
  return true;
}, 'Theatre roles require a theatre; customers cannot be assigned to a theatre');

const safeUserSelect = {
  id: true, fullName: true, email: true, mobileNumber: true, role: true,
  theatreId: true, isBlocked: true, lastLoginAt: true, createdAt: true,
  theatre: { select: { id: true, name: true, city: true, status: true } }
};

const createSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(128),
    email: z.string().trim().email().max(255),
    mobileNumber: z.string().trim().max(20).optional(),
    password: z.string().min(12).max(128),
    role: z.enum(['CUSTOMER', 'THEATRE_MANAGER', 'THEATRE_STAFF']),
    theatreId: z.string().uuid().nullable().optional()
  }).refine((value) => {
    if (['THEATRE_MANAGER', 'THEATRE_STAFF'].includes(value.role)) return Boolean(value.theatreId);
    return !value.theatreId;
  }, 'Theatre roles require a theatre; customers cannot be assigned to a theatre')
});

router.post('/', validateRequest(createSchema), async (req, res, next) => {
  try {
    const { fullName, email, mobileNumber, password, role, theatreId } = req.body;
    if (theatreId) {
      const theatre = await prisma.theatre.findUnique({ where: { id: theatreId }, select: { id: true } });
      if (!theatre) throw new AppError(404, 'Theatre not found', 'THEATRE_NOT_FOUND');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { fullName, email, mobileNumber, passwordHash, role, theatreId: theatreId ?? null },
        select: safeUserSelect
      });
      await tx.auditLog.create({ data: {
        actorId: req.user.id,
        action: 'ADMIN_CREATE_USER',
        targetEntity: 'USER',
        targetId: created.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        newState: { role: created.role, theatreId: created.theatreId, isBlocked: created.isBlocked }
      } });
      return created;
    });
    res.status(201).json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.get('/', validateRequest(listSchema), async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
    const where = {
      ...(req.query.role ? { role: req.query.role } : {}),
      ...(req.query.theatreId ? { theatreId: req.query.theatreId } : {}),
      ...(req.query.blocked ? { isBlocked: req.query.blocked === 'true' } : {}),
      ...(req.query.q ? {
        OR: [
          { fullName: { contains: req.query.q, mode: 'insensitive' } },
          { email: { contains: req.query.q, mode: 'insensitive' } },
          { mobileNumber: { contains: req.query.q } }
        ]
      } : {})
    };
    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, select: safeUserSelect, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize })
    ]);
    res.json({ success: true, data: users, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (err) { next(err); }
});

router.patch('/:id', validateRequest(updateSchema), async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user.id && (req.body.role || req.body.isBlocked === true)) {
      throw new AppError(400, 'You cannot change your own role or block your own account', 'SELF_ADMIN_CHANGE');
    }

    const current = await prisma.user.findUnique({ where: { id: targetId }, select: safeUserSelect });
    if (!current) throw new AppError(404, 'User not found', 'NOT_FOUND');

    const nextRole = req.body.role ?? current.role;
    const hasTheatreId = Object.hasOwn(req.body, 'theatreId');
    const nextTheatreId = hasTheatreId ? req.body.theatreId : current.theatreId;
    if (nextRole === 'CUSTOMER' && nextTheatreId) {
      throw new AppError(400, 'Customers cannot be assigned to a theatre', 'INVALID_ROLE_THEATRE');
    }
    if (['THEATRE_MANAGER', 'THEATRE_STAFF'].includes(nextRole) && !nextTheatreId) {
      throw new AppError(400, 'A theatre is required for theatre staff accounts', 'THEATRE_REQUIRED');
    }
    if (nextTheatreId) {
      const theatre = await prisma.theatre.findUnique({ where: { id: nextTheatreId }, select: { id: true } });
      if (!theatre) throw new AppError(404, 'Theatre not found', 'THEATRE_NOT_FOUND');
    }

    const data = {
      ...(req.body.role ? { role: req.body.role } : {}),
      ...(hasTheatreId ? { theatreId: req.body.theatreId } : {}),
      ...(typeof req.body.isBlocked === 'boolean' ? { isBlocked: req.body.isBlocked } : {})
    };
    const revokeSessions = data.isBlocked === true || (data.role && data.role !== current.role) || (hasTheatreId && data.theatreId !== current.theatreId);

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id: targetId }, data, select: safeUserSelect });
      if (revokeSessions) {
        await tx.refreshToken.updateMany({ where: { userId: targetId, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      await tx.auditLog.create({ data: {
        actorId: req.user.id,
        action: 'ADMIN_UPDATE_USER',
        targetEntity: 'USER',
        targetId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        previousState: { role: current.role, theatreId: current.theatreId, isBlocked: current.isBlocked },
        newState: { role: user.role, theatreId: user.theatreId, isBlocked: user.isBlocked }
      } });
      return user;
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

export default router;
