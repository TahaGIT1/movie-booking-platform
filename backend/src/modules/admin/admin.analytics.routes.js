import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import { prisma } from '../../config/prisma.js';

const router = Router();

router.use(authenticate, requirePermission('VIEW_REPORTS'), enforceTenantScope);

router.get('/sales', async (req, res, next) => {
  try {
    const theatreId = req.tenantId;
    // Get all bookings for shows in this theatre that are CONFIRMED
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        show: {
          theatreId
        }
      },
      select: {
        totalAmountCents: true,
        createdAt: true
      }
    });

    const totalSalesCents = bookings.reduce((sum, b) => sum + b.totalAmountCents, 0);
    const totalTickets = bookings.length;

    res.json({ success: true, data: { totalSalesCents, totalTickets } });
  } catch (err) { next(err); }
});

export default router;
