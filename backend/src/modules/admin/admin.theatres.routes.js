import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.middleware.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';

const router = Router();
const theatreStatuses = ['DOCS_VERIFIED', 'APPROVED', 'REJECTED', 'SUSPENDED', 'ACTIVE'];

// Platform-wide theatre decisions are restricted to Super Admin accounts.
router.use(authenticate, (req, _res, next) => {
  if (req.user.role !== 'SUPER_ADMIN') return next(new AppError(403, 'Platform administrator access required', 'FORBIDDEN'));
  next();
});

const idParams = z.object({ id: z.string().uuid() });
const statusBody = z.object({ status: z.enum(theatreStatuses), reason: z.string().trim().max(500).optional() });

router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status;
    const theatres = await prisma.theatre.findMany({
      where: status ? { status } : {},
      include: {
        users: { select: { id: true, fullName: true, email: true, mobileNumber: true, role: true, createdAt: true } },
        screens: { select: { id: true, name: true, supportedFormats: true, totalCapacity: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: theatres });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = z.object({
      name: z.string().trim().min(2), legalEntityName: z.string().optional(), gstNumber: z.string().optional(),
      contactPhone: z.string().optional(), contactEmail: z.string().email().optional(), addressLine: z.string().min(2),
      city: z.string().min(2), state: z.string().min(2), postalCode: z.string().optional(),
      amenities: z.array(z.string()).optional(), status: z.enum(['APPROVED', 'ACTIVE']).default('ACTIVE')
    }).parse(req.body);
    const theatre = await prisma.theatre.create({ data: { ...data, amenities: data.amenities || [] } });
    res.status(201).json({ success: true, data: theatre, message: 'Theatre created successfully' });
  } catch (err) { next(err); }
});

router.post('/:id/approve', validateRequest(idParams, 'params'), validateRequest(z.object({ status: z.enum(['APPROVED', 'ACTIVE']).default('APPROVED') })), async (req, res, next) => {
  try {
    const theatre = await setTheatreStatus(req, req.body.status);
    res.json({ success: true, data: theatre, message: 'Theatre application approved successfully' });
  } catch (err) { next(err); }
});

router.post('/:id/reject', validateRequest(idParams, 'params'), validateRequest(z.object({ reason: z.string().trim().min(1).max(500) })), async (req, res, next) => {
  try {
    const existing = await prisma.theatre.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, 'Theatre not found', 'NOT_FOUND');
    if (['APPROVED', 'ACTIVE'].includes(existing.status)) throw new AppError(400, 'Cannot reject an approved theatre', 'CANNOT_REJECT_APPROVED_THEATRE');
    const theatre = await setTheatreStatus(req, 'REJECTED', req.body.reason);
    res.json({ success: true, data: theatre, message: 'Theatre application rejected' });
  } catch (err) { next(err); }
});

router.patch('/:id/status', validateRequest(idParams, 'params'), validateRequest(statusBody), async (req, res, next) => {
  try {
    const theatre = await setTheatreStatus(req, req.body.status, req.body.reason);
    res.json({ success: true, data: theatre });
  } catch (err) { next(err); }
});

async function setTheatreStatus(req, status, reason) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.theatre.findUnique({ where: { id: req.params.id } });
    if (!before) throw new AppError(404, 'Theatre not found', 'NOT_FOUND');
    const theatre = await tx.theatre.update({
      where: { id: req.params.id },
      data: { status, ...(status === 'REJECTED' ? { rejectionReason: reason || 'Rejected by platform administrator' } : { rejectionReason: null }) }
    });
    await tx.auditLog.create({ data: {
      actorId: req.user.id, action: `THEATRE_${status}`, targetEntity: 'THEATRE', targetId: theatre.id,
      ipAddress: req.ip, userAgent: req.get('user-agent'),
      previousState: { status: before.status }, newState: { status, reason: reason ?? null }
    } });
    return theatre;
  });
}

export default router;
