import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { createScreenSchema, createSeatsSchema } from './screens.schema.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const router = Router();

router.use(authenticate, requirePermission('MANAGE_SCREEN'), enforceTenantScope);

router.post('/', validateRequest(createScreenSchema), async (req, res, next) => {
  try {
    const screen = await prisma.screen.create({
      data: { ...req.body, theatreId: req.tenantId }
    });
    res.status(201).json({ success: true, data: screen });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const screens = await prisma.screen.findMany({ where: { theatreId: req.tenantId } });
    res.json({ success: true, data: screens });
  } catch (err) { next(err); }
});

router.post('/:id/seats', validateRequest(createSeatsSchema), async (req, res, next) => {
  try {
    const screen = await prisma.screen.findUnique({ where: { id: req.params.id } });
    if (!screen || screen.theatreId !== req.tenantId) throw new AppError(404, 'Screen not found');

    const { rows, cols } = req.body;
    const seats = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    for (let i = 0; i < rows; i++) {
      for (let j = 1; j <= cols; j++) {
        seats.push({
          screenId: screen.id,
          rowLabel: letters[i],
          seatNumber: j,
          gridX: j,
          gridY: i
        });
      }
    }
    
    await prisma.seat.createMany({ data: seats, skipDuplicates: true });
    res.status(201).json({ success: true, message: 'Seats created' });
  } catch (err) { next(err); }
});

export default router;