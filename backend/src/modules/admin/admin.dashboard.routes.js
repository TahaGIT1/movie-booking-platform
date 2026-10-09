import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { AppError } from '../../middleware/error.middleware.js';
import { prisma } from '../../config/prisma.js';

const router = Router();
router.use(authenticate, (req, _res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') return next(new AppError(403, 'Platform administrator access required', 'FORBIDDEN'));
  next();
});

router.get('/overview', async (_req, res, next) => {
  try {
    const [users, theatres, movies, activeShows, confirmedBookings, revenue, theatreStatuses, recentActivity] = await Promise.all([
      prisma.user.count(),
      prisma.theatre.count(),
      prisma.movie.count(),
      prisma.show.count({ where: { isCancelled: false, startTime: { gte: new Date() } } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.aggregate({ where: { status: 'CONFIRMED' }, _sum: { totalAmountCents: true } }),
      prisma.theatre.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.auditLog.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { actor: { select: { id: true, fullName: true, email: true } } } })
    ]);
    res.json({ success: true, data: {
      metrics: { users, theatres, movies, activeShows, confirmedBookings, grossRevenueCents: revenue._sum.totalAmountCents ?? 0 },
      theatreStatuses: Object.fromEntries(theatreStatuses.map(({ status, _count }) => [status, _count._all])),
      recentActivity: recentActivity.map((event) => ({ ...event, id: String(event.id) }))
    } });
  } catch (err) { next(err); }
});

router.get('/activity', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 30));
    const where = {
      ...(req.query.action ? { action: { contains: String(req.query.action).slice(0, 64), mode: 'insensitive' } } : {}),
      ...(req.query.targetEntity ? { targetEntity: String(req.query.targetEntity).slice(0, 64) } : {})
    };
    const [total, events] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({ where, include: { actor: { select: { id: true, fullName: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize })
    ]);
    res.json({ success: true, data: events.map((event) => ({ ...event, id: String(event.id) })), pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (err) { next(err); }
});

export default router;
