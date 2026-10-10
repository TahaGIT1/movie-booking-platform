import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const router = Router();

router.use(authenticate, requirePermission('SCAN_TICKET'), enforceTenantScope);

router.post('/validate-ticket', async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { show: true } });

    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.show.theatreId !== req.tenantId) throw new AppError(403, 'Ticket belongs to another theatre');
    if (booking.status !== 'CONFIRMED') throw new AppError(400, 'Ticket is not confirmed');
    if (booking.qrScanStatus === 'USED') throw new AppError(400, 'Ticket already used');

    await prisma.booking.update({
      where: { id: bookingId },
      data: { qrScanStatus: 'USED', scannedAt: new Date(), scannedByStaffId: req.user.id }
    });

    res.json({ success: true, message: 'ENTRY_ALLOWED' });
  } catch (err) { next(err); }
});

export default router;