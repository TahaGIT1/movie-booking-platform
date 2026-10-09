import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { z } from 'zod';

const router = Router();

// Platform-wide theatre decisions must never be granted by a local manager
// permission row or by GLOBAL_OVERRIDE.
router.use(authenticate, (req, _res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') return next(new AppError(403, 'Platform administrator access required', 'FORBIDDEN'));
  next();
});

const statusSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED', 'ACTIVE']), reason: z.string().trim().max(500).optional() })
});

router.get('/', async (req, res, next) => {
  try {
    const theatres = await prisma.theatre.findMany();
    res.json({ success: true, data: theatres });
  } catch (err) { next(err); }
});

router.post('/:id/approve', async (req, res, next) => {
  try {
    const theatre = await setTheatreStatus(req, 'APPROVED');
    res.json({ success: true, data: theatre });
  } catch (err) { next(err); }
});

router.patch('/:id/status', validateRequest(statusSchema), async (req, res, next) => {
  try {
    const theatre = await setTheatreStatus(req, req.body.status, req.body.reason);
    res.json({ success: true, data: theatre });
  } catch (err) { next(err); }
});

async function setTheatreStatus(req, status, reason) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.theatre.findUnique({ where: { id: req.params.id } });
    if (!before) throw new AppError(404, 'Theatre not found', 'NOT_FOUND');
    const theatre = await tx.theatre.update({ where: { id: req.params.id }, data: { status } });
    await tx.auditLog.create({ data: {
      actorId: req.user.id,
      action: `THEATRE_${status}`,
      targetEntity: 'THEATRE',
      targetId: theatre.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      previousState: { status: before.status },
      newState: { status, reason: reason ?? null }
    } });
    return theatre;
  });
}

export default router;
