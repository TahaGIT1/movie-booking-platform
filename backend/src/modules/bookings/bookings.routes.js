import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { prisma } from '../../config/prisma.js';
import { io } from '../../server.js';
import { AppError } from '../../middleware/error.middleware.js';
import crypto from 'crypto';

const router = Router();

router.use(authenticate, requirePermission('BOOK_TICKETS'));

router.post('/initiate', async (req, res, next) => {
  try {
    const { showId, seatIds } = req.body;
    const userId = req.user.id;
    const now = new Date();

    // Verify locks in DB
    const seats = await prisma.showSeatStatus.findMany({
      where: {
        showId,
        seatId: { in: seatIds }
      }
    });

    if (seats.length !== seatIds.length) {
      throw new AppError(404, 'Some seats were not found');
    }

    for (const seatStatus of seats) {
      const isHeldByMe = seatStatus.lockedByUserId === userId && 
                         seatStatus.lockExpiresAt && 
                         new Date(seatStatus.lockExpiresAt) > now;
      
      if (!isHeldByMe) {
        throw new AppError(403, 'You do not hold the lock for these seats or it has expired');
      }
    }

    const bookingReference = 'CV' + Math.floor(Math.random() * 100000000);
    const subtotal = seatIds.length * 200; // Mock 200 cents

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          bookingReference,
          userId,
          showId,
          subtotalCents: subtotal,
          totalAmountCents: subtotal,
          status: 'INITIATED',
          seats: {
            create: seatIds.map(seatId => ({
              seatId,
              allocatedPriceCents: 200
            }))
          }
        },
        include: { seats: true }
      });
      return b;
    });

    res.status(201).json({ success: true, data: booking });
  } catch (err) { next(err); }
});

router.post('/:id/mock-payment', async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body; // 'SUCCESS' or 'FAILED'
    const userId = req.user.id;
    const now = new Date();

    const booking = await prisma.booking.findUnique({ 
      where: { id: bookingId },
      include: { seats: true }
    });

    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.userId !== userId) throw new AppError(403, 'Unauthorized');
    if (booking.status !== 'INITIATED') throw new AppError(400, 'Booking is already processed');

    if (status === 'SUCCESS') {
      await prisma.$transaction(async (tx) => {
        const sortedSeatIds = booking.seats.map(s => s.seatId).sort();
        
        for (const seatId of sortedSeatIds) {
          const rows = await tx.$queryRaw`
            SELECT id, status, locked_by_user_id, lock_expires_at 
            FROM show_seat_status 
            WHERE show_id = \${booking.showId}::uuid AND seat_id = \${seatId}::uuid 
            FOR UPDATE
          `;
          
          if (rows.length === 0) throw new AppError(404, 'Seat not found');
          
          const seatStatus = rows[0];
          
          const isHeldByMe = seatStatus.locked_by_user_id === userId && 
                             seatStatus.lock_expires_at && 
                             new Date(seatStatus.lock_expires_at) > now;
                             
          if (!isHeldByMe) {
            throw new AppError(400, 'Hold expired before payment could complete', 'HOLD_EXPIRED');
          }

          if (seatStatus.status !== 'AVAILABLE') {
            throw new AppError(409, 'Seat is no longer available', 'SEAT_UNAVAILABLE');
          }

          // Mark as booked
          await tx.$queryRaw`
            UPDATE show_seat_status
            SET status = 'BOOKED', locked_by_user_id = NULL, lock_expires_at = NULL
            WHERE id = \${seatStatus.id}::uuid
          `;
        }

        await tx.payment.create({
          data: {
            bookingId,
            amountCents: booking.totalAmountCents,
            paymentMethod: 'MOCK',
            status: 'SUCCESS',
            idempotencyKey: crypto.randomUUID()
          }
        });

        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED' }
        });
      });

      // Broadcast updates
      for (const bs of booking.seats) {
        io.to(`show:\${booking.showId}`).emit('seat:booked', { seatId: bs.seatId, userId });
      }

      res.json({ success: true, message: 'Payment successful, tickets booked' });
    } else {
      // Payment Failed: release holds if we still own them, and mark booking failed
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({ where: { id: bookingId }, data: { status: 'FAILED' } });
        
        const sortedSeatIds = booking.seats.map(s => s.seatId).sort();
        
        for (const seatId of sortedSeatIds) {
          const rows = await tx.$queryRaw`
            SELECT id, locked_by_user_id, lock_expires_at 
            FROM show_seat_status 
            WHERE show_id = \${booking.showId}::uuid AND seat_id = \${seatId}::uuid 
            FOR UPDATE
          `;
          
          if (rows.length > 0) {
             const seatStatus = rows[0];
             if (seatStatus.locked_by_user_id === userId) {
               await tx.$queryRaw`
                 UPDATE show_seat_status
                 SET locked_by_user_id = NULL, lock_expires_at = NULL
                 WHERE id = \${seatStatus.id}::uuid
               `;
             }
          }
        }
      });
      
      for (const bs of booking.seats) {
        io.to(`show:\${booking.showId}`).emit('seat:released', { seatId: bs.seatId });
      }

      res.json({ success: false, message: 'Payment failed' });
    }
  } catch (err) { next(err); }
});

router.get('/my', async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({ where: { userId: req.user.id } });
    res.json({ success: true, data: bookings });
  } catch (err) { next(err); }
});



router.post('/:id/cancel', async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { seats: true }
    });

    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.userId !== userId) throw new AppError(403, 'Unauthorized');
    if (booking.status !== 'CONFIRMED') throw new AppError(400, 'Only confirmed bookings can be cancelled');
    if (booking.qrScanStatus === 'USED') throw new AppError(400, 'Cannot cancel a used ticket');

    await prisma.$transaction(async (tx) => {
      // Release seats
      const sortedSeatIds = booking.seats.map(s => s.seatId).sort();
      for (const seatId of sortedSeatIds) {
        await tx.$queryRaw`
          UPDATE show_seat_status
          SET status = 'AVAILABLE', locked_by_user_id = NULL, lock_expires_at = NULL
          WHERE show_id = ${booking.showId}::uuid AND seat_id = ${seatId}::uuid
        `;
      }

      await tx.refund.create({
        data: {
          bookingId,
          amountCents: booking.totalAmountCents,
          reason: 'Customer requested cancellation',
          status: 'SUCCESS'
        }
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      });
    });

    for (const bs of booking.seats) {
      io.to(`show:${booking.showId}`).emit('seat:released', { seatId: bs.seatId });
    }

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) { next(err); }
});

export default router;
