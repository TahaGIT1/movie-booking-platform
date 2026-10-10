import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import { prisma } from '../../config/prisma.js';
import { io } from '../../socket.js';
import { AppError } from '../../middleware/error.middleware.js';
import crypto from 'crypto';
import { captureRazorpayPayment, createRazorpayOrder, fetchRazorpayPayment, paymentQrToken, verifyCheckoutSignature } from './razorpay.js';

const router = Router();

router.use(authenticate);

// Manager: Get all bookings for their theatre's shows
router.get('/theatre', requirePermission(['VIEW_BOOKINGS', 'MANAGE_BOOKINGS', 'MANAGE_THEATRE']), enforceTenantScope, async (req, res, next) => {
  try {
    const { status, showId, search } = req.query;
    const where = {
      show: { theatreId: req.tenantId }
    };
    if (status) where.status = status;
    if (showId) where.showId = showId;
    if (search) {
      where.OR = [
        { bookingReference: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, mobileNumber: true } },
        show: { include: { movie: true, screen: true } },
        seats: { include: { seat: true } },
        payments: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    res.json({ success: true, data: bookings });
  } catch (err) { next(err); }
});

router.post('/initiate', requirePermission(['BOOK_TICKETS', 'MANAGE_BOOKINGS']), async (req, res, next) => {
  try {
    const { showId, seatIds } = req.body;
    if (!showId || !Array.isArray(seatIds) || seatIds.length < 1 || seatIds.length > 10 || new Set(seatIds).size !== seatIds.length) {
      throw new AppError(400, 'Choose between 1 and 10 unique seats');
    }
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

    const show = await prisma.show.findUnique({ where: { id: showId }, include: { movie: true, theatre: true } });
    if (!show || show.isCancelled || show.startTime <= now) throw new AppError(404, 'Show is no longer available');

    const seatRecords = await prisma.seat.findMany({
      where: { id: { in: seatIds }, screenId: show.screenId, isBroken: false }
    });
    if (seatRecords.length !== seatIds.length) throw new AppError(400, 'One or more selected seats cannot be booked');

    const pricing = (typeof show.baseTierPricing === 'object' && show.baseTierPricing !== null)
      ? show.baseTierPricing
      : { NORMAL: 250, PREMIUM: 380, RECLINER: 550 };

    let calculatedSubtotal = 0;
    const seatAllocations = seatRecords.map(seat => {
      // Pricing stored in rupees; cents conversion (or direct unit)
      const unitPrice = Number(pricing[seat.tier] || pricing.NORMAL || 250);
      calculatedSubtotal += unitPrice;
      return {
        seatId: seat.id,
        allocatedPriceCents: Math.round(unitPrice * 100)
      };
    });

    // Show prices are configured in rupees; persist money as integer paise.
    const totalAmountCents = Math.round(calculatedSubtotal * 100);
    const bookingReference = `CV${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    let booking = await prisma.booking.create({
        data: {
          bookingReference,
          userId,
          showId,
          subtotalCents: totalAmountCents,
          totalAmountCents,
          status: 'INITIATED',
          seats: {
            create: seatAllocations
          }
        },
        include: { seats: true }
      });
    try {
      const { order, keyId } = await createRazorpayOrder({
        amountPaise: totalAmountCents,
        receipt: bookingReference,
        notes: { bookingId: booking.id, userId }
      });
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          gatewayName: 'RAZORPAY',
          gatewayOrderId: order.id,
          amountCents: totalAmountCents,
          currency: 'INR',
          paymentMethod: 'RAZORPAY',
          status: 'INITIATED',
          idempotencyKey: crypto.randomUUID()
        }
      });
      booking = { ...booking, razorpay: { keyId, orderId: order.id, amount: order.amount, currency: order.currency } };
    } catch (orderError) {
      await prisma.booking.update({ where: { id: booking.id }, data: { status: 'EXPIRED' } });
      await prisma.showSeatStatus.updateMany({ where: { showId, seatId: { in: seatIds }, lockedByUserId: userId }, data: { lockedByUserId: null, lockExpiresAt: null } });
      throw orderError;
    }

    res.status(201).json({ success: true, data: booking });
  } catch (err) { next(err); }
});

router.post('/:id/verify-payment', requirePermission(['BOOK_TICKETS', 'MANAGE_BOOKINGS']), async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    const userId = req.user.id;
    const now = new Date();

    const booking = await prisma.booking.findUnique({ 
      where: { id: bookingId },
      include: { seats: true }
    });

    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.userId !== userId) throw new AppError(403, 'Unauthorized');
    if (booking.status === 'CONFIRMED') {
      return res.json({ success: true, message: 'Payment already verified', data: { bookingId, bookingReference: booking.bookingReference, qrText: JSON.stringify({ bookingId, bookingReference: booking.bookingReference, token: booking.qrPayloadHash }) } });
    }
    if (booking.status !== 'INITIATED') throw new AppError(400, 'Booking is already processed');
    if (!orderId || !paymentId || !signature || !verifyCheckoutSignature({ orderId, paymentId, signature })) {
      throw new AppError(400, 'Payment signature verification failed', 'PAYMENT_SIGNATURE_INVALID');
    }
    const payment = await prisma.payment.findFirst({ where: { bookingId, gatewayOrderId: orderId, gatewayName: 'RAZORPAY' } });
    if (!payment || payment.amountCents !== booking.totalAmountCents) throw new AppError(400, 'Payment order does not match this booking', 'PAYMENT_ORDER_MISMATCH');
    let gatewayPayment = await fetchRazorpayPayment(paymentId);
    if (gatewayPayment.order_id !== orderId || gatewayPayment.amount !== booking.totalAmountCents || gatewayPayment.currency !== 'INR') {
      throw new AppError(400, 'Razorpay payment details do not match this booking', 'PAYMENT_DETAILS_MISMATCH');
    }
    if (gatewayPayment.status === 'authorized') {
      gatewayPayment = await captureRazorpayPayment({ paymentId, amountPaise: booking.totalAmountCents, currency: 'INR' });
    }
    if (gatewayPayment.status !== 'captured') {
      throw new AppError(402, 'Razorpay has not confirmed a captured payment', 'PAYMENT_NOT_CAPTURED');
    }

    await prisma.$transaction(async (tx) => {
        const sortedSeatIds = booking.seats.map(s => s.seatId).sort();
        
        for (const seatId of sortedSeatIds) {
          const rows = await tx.$queryRaw`
            SELECT id, status, locked_by_user_id, lock_expires_at 
            FROM show_seat_status 
            WHERE show_id = ${booking.showId}::uuid AND seat_id = ${seatId}::uuid 
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
            WHERE id = ${seatStatus.id}::uuid
          `;
        }

        await tx.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS', gatewayTransactionId: paymentId, gatewayResponse: { orderId, paymentId } } });

        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED', qrPayloadHash: paymentQrToken(bookingId) }
        });
      });

      // Broadcast updates
      for (const bs of booking.seats) {
        io.to(`show:${booking.showId}`).emit('seat:booked', { seatId: bs.seatId, userId });
      }

      const confirmed = await prisma.booking.findUnique({ where: { id: bookingId }, select: { bookingReference: true, qrPayloadHash: true } });
      res.json({ success: true, message: 'Payment verified, tickets confirmed', data: { bookingId, bookingReference: confirmed.bookingReference, qrText: JSON.stringify({ bookingId, bookingReference: confirmed.bookingReference, token: confirmed.qrPayloadHash }) } });
  } catch (err) { next(err); }
});

router.post('/:id/abandon', requirePermission(['BOOK_TICKETS', 'MANAGE_BOOKINGS']), async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include: { seats: true, payments: true } });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.userId !== req.user.id) throw new AppError(403, 'Unauthorized');
    if (booking.status !== 'INITIATED') return res.json({ success: true, data: { status: booking.status } });
    if (booking.payments.some((payment) => payment.status === 'SUCCESS')) throw new AppError(409, 'A successful payment cannot be abandoned');
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({ where: { id: booking.id }, data: { status: 'EXPIRED' } });
      await tx.payment.updateMany({ where: { bookingId: booking.id, status: 'INITIATED' }, data: { status: 'CANCELLED' } });
      for (const { seatId } of booking.seats) {
        await tx.showSeatStatus.updateMany({ where: { showId: booking.showId, seatId, lockedByUserId: req.user.id }, data: { lockedByUserId: null, lockExpiresAt: null } });
        io.to(`show:${booking.showId}`).emit('seat:released', { seatId });
      }
    });
    res.json({ success: true, message: 'Booking hold released' });
  } catch (err) { next(err); }
});

router.get('/my', async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        show: { include: { movie: true, screen: true, theatre: true } },
        seats: { include: { seat: true } },
        payments: { select: { id: true, gatewayName: true, gatewayTransactionId: true, amountCents: true, currency: true, status: true, createdAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
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
