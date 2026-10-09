import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { createShowSchema } from './shows.schema.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { io } from '../../server.js';

const router = Router();

router.get('/:id/seats', async (req, res, next) => {
  try {
    const showId = req.params.id;
    const seats = await prisma.showSeatStatus.findMany({ where: { showId }, include: { seat: true } });
    
    // Ignore expired holds
    const now = new Date();
    const result = seats.map(seat => {
      if (seat.status === 'AVAILABLE' && seat.lockedByUserId && seat.lockExpiresAt && seat.lockExpiresAt < now) {
        return { ...seat, lockedByUserId: null, lockExpiresAt: null };
      }
      return seat;
    });

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/:id/seats/lock', authenticate, requirePermission('BOOK_TICKETS'), async (req, res, next) => {
  try {
    const showId = req.params.id;
    const { seatIds } = req.body;
    const userId = req.user.id;
    const now = new Date();
    const expiryTime = new Date(now.getTime() + 300 * 1000); // 5 minutes from now

    await prisma.$transaction(async (tx) => {
      // Sort seat IDs to prevent deadlocks
      const sortedSeatIds = [...seatIds].sort();

      for (const seatId of sortedSeatIds) {
        // Find and lock the row
        // Because Prisma doesn't have a direct raw select for update on relations easily without throwing away typings, 
        // we can use raw query for locking.
        const rows = await tx.$queryRaw`
          SELECT id, status, locked_by_user_id, lock_expires_at 
          FROM show_seat_status 
          WHERE show_id = \${showId}::uuid AND seat_id = \${seatId}::uuid 
          FOR UPDATE
        `;

        if (rows.length === 0) {
          throw new AppError(404, 'Seat not found in show');
        }

        const seatStatus = rows[0];

        if (seatStatus.status !== 'AVAILABLE') {
          throw new AppError(409, 'Seat is not available', 'SEAT_UNAVAILABLE', { seatId });
        }

        const isHeldByOther = seatStatus.locked_by_user_id && 
                              seatStatus.locked_by_user_id !== userId && 
                              seatStatus.lock_expires_at && 
                              new Date(seatStatus.lock_expires_at) > now;

        if (isHeldByOther) {
          throw new AppError(409, 'Seat already locked', 'SEAT_LOCKED', { seatId });
        }

        // Update the row
        await tx.$queryRaw`
          UPDATE show_seat_status
          SET locked_by_user_id = \${userId}::uuid, lock_expires_at = \${expiryTime}
          WHERE id = \${seatStatus.id}::uuid
        `;
      }
    });

    // Broadcast after successful transaction
    for (const seatId of seatIds) {
      io.to(`show:\${showId}`).emit('seat:locked', { seatId, userId, lockExpiresAt: expiryTime });
    }

    res.json({ success: true, message: 'Seats locked', lockExpiresAt: expiryTime });
  } catch (err) { next(err); }
});

router.post('/:id/seats/release', authenticate, requirePermission('BOOK_TICKETS'), async (req, res, next) => {
  try {
    const showId = req.params.id;
    const { seatIds } = req.body;
    const userId = req.user.id;

    await prisma.$transaction(async (tx) => {
      const sortedSeatIds = [...seatIds].sort();

      for (const seatId of sortedSeatIds) {
        const rows = await tx.$queryRaw`
          SELECT id, locked_by_user_id 
          FROM show_seat_status 
          WHERE show_id = \${showId}::uuid AND seat_id = \${seatId}::uuid 
          FOR UPDATE
        `;

        if (rows.length === 0) continue;

        const seatStatus = rows[0];

        // Only allow releasing if it's held by this user
        if (seatStatus.locked_by_user_id === userId) {
          await tx.$queryRaw`
            UPDATE show_seat_status
            SET locked_by_user_id = NULL, lock_expires_at = NULL
            WHERE id = \${seatStatus.id}::uuid
          `;
        } else {
          throw new AppError(403, 'You do not own the hold for this seat');
        }
      }
    });

    for (const seatId of seatIds) {
      io.to(`show:\${showId}`).emit('seat:released', { seatId });
    }

    res.json({ success: true, message: 'Seats released' });
  } catch (err) { next(err); }
});

// Manager routes
router.post('/', authenticate, requirePermission('CREATE_SHOW'), enforceTenantScope, validateRequest(createShowSchema), async (req, res, next) => {
  try {
    const data = { ...req.body };
    data.startTime = new Date(data.startTime);
    data.endTime = new Date(data.endTime);
    data.theatreId = req.tenantId;

    if (data.startTime >= data.endTime) throw new AppError(400, 'Invalid time range');

    const overlap = await prisma.show.findFirst({ where: { screenId: data.screenId, OR: [{ AND: [{ startTime: { lte: data.startTime } }, { endTime: { gt: data.startTime } }] }, { AND: [{ startTime: { lt: data.endTime } }, { endTime: { gte: data.endTime } }] }, { AND: [{ startTime: { gte: data.startTime } }, { endTime: { lte: data.endTime } }] }] } });
    if (overlap) throw new AppError(409, 'Show time overlaps with an existing show on this screen', 'SHOW_OVERLAP');

    const show = await prisma.show.create({ data });
    
    // Create show_seat_status
    const seats = await prisma.seat.findMany({ where: { screenId: data.screenId } });
    const seatStatuses = seats.map(s => ({ showId: show.id, seatId: s.id }));
    await prisma.showSeatStatus.createMany({ data: seatStatuses });
    
    res.status(201).json({ success: true, data: show });
  } catch (err) { next(err); }
});

export default router;

