import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const router = Router();

router.use(authenticate, requirePermission(['MANAGE_SCREEN', 'MANAGE_SCREENS', 'MANAGE_SEATS']), enforceTenantScope);

router.put('/:id', async (req, res, next) => {
  try {
    const seatId = req.params.id;
    const { tier, isAccessible, isBroken } = req.body;

    const seat = await prisma.seat.findUnique({
      where: { id: seatId },
      include: { screen: true }
    });

    if (!seat) throw new AppError(404, 'Seat not found');
    if (seat.screen.theatreId !== req.tenantId) throw new AppError(403, 'Unauthorized for this theatre');

    const updatedSeat = await prisma.seat.update({
      where: { id: seatId },
      data: {
        ...(tier && { tier }),
        ...(isAccessible !== undefined && { isAccessible }),
        ...(isBroken !== undefined && { isBroken })
      }
    });

    res.json({ success: true, data: updatedSeat });
  } catch (err) { next(err); }
});

router.post('/bulk-update', async (req, res, next) => {
  try {
    const { seatIds, tier, isAccessible, isBroken } = req.body;

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      throw new AppError(400, 'seatIds array is required');
    }

    // Verify all seats belong to this theatre
    const seats = await prisma.seat.findMany({
      where: { id: { in: seatIds } },
      include: { screen: true }
    });

    const invalidSeats = seats.filter(s => s.screen.theatreId !== req.tenantId);
    if (invalidSeats.length > 0) throw new AppError(403, 'Some seats do not belong to your theatre');

    const data = {};
    if (tier) data.tier = tier;
    if (isAccessible !== undefined) data.isAccessible = isAccessible;
    if (isBroken !== undefined) data.isBroken = isBroken;

    await prisma.seat.updateMany({
      where: { id: { in: seatIds } },
      data
    });

    res.json({ success: true, message: `${seatIds.length} seats updated successfully` });
  } catch (err) { next(err); }
});

export default router;
