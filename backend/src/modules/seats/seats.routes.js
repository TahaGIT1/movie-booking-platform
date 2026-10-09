import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const router = Router();

router.use(authenticate, requirePermission('MANAGE_SCREEN'), enforceTenantScope);

router.put('/:id', async (req, res, next) => {
  try {
    const seatId = req.params.id;
    const { tier, isAccessible, status } = req.body;

    const seat = await prisma.seat.findUnique({
      where: { id: seatId },
      include: { screen: true }
    });

    if (!seat) throw new AppError(404, 'Seat not found');
    if (seat.screen.theatreId !== req.tenantId) throw new AppError(403, 'Unauthorized for this theatre');

    const updatedSeat = await prisma.seat.update({
      where: { id: seatId },
      data: { tier, isAccessible, status }
    });

    res.json({ success: true, data: updatedSeat });
  } catch (err) { next(err); }
});

router.post('/bulk-update', async (req, res, next) => {
  try {
    const { seatIds, tier, isAccessible, status } = req.body;

    // Verify all seats belong to this theatre
    const seats = await prisma.seat.findMany({
      where: { id: { in: seatIds } },
      include: { screen: true }
    });

    const invalidSeats = seats.filter(s => s.screen.theatreId !== req.tenantId);
    if (invalidSeats.length > 0) throw new AppError(403, 'Some seats do not belong to your theatre');

    await prisma.seat.updateMany({
      where: { id: { in: seatIds } },
      data: { tier, isAccessible, status }
    });

    res.json({ success: true, message: 'Seats updated successfully' });
  } catch (err) { next(err); }
});

export default router;
