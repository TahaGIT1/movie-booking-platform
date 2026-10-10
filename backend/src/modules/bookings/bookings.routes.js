import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import { prisma } from '../../config/prisma.js';
import { io } from '../../socket.js';
import { AppError } from '../../middleware/error.middleware.js';

const router = Router();

// ==========================================
// 1. Public & Customer Discovery Routes
// ==========================================

// Public: Check occupied/booked seats for a theatre, date, time or showId
router.get('/occupied-seats', async (req, res, next) => {
  try {
    const { theatre, date, time, showId } = req.query;
    let targetShowId = showId;

    if (!targetShowId && theatre) {
      const show = await prisma.show.findFirst({
        where: {
          theatre: { name: { contains: theatre, mode: 'insensitive' } }
        },
        orderBy: { startTime: 'asc' }
      });
      if (show) targetShowId = show.id;
    }

    if (!targetShowId) {
      const firstShow = await prisma.show.findFirst();
      if (firstShow) targetShowId = firstShow.id;
    }

    if (targetShowId) {
      const seatStatuses = await prisma.showSeatStatus.findMany({
        where: {
          showId: targetShowId,
          OR: [
            { status: 'BOOKED' },
            { status: 'UNAVAILABLE' },
            {
              lockedByUserId: { not: null },
              lockExpiresAt: { gt: new Date() }
            }
          ]
        },
        include: { seat: true }
      });

      const occupied = seatStatuses.map(s => {
        if (s.seat) return `${s.seat.rowLabel}${s.seat.seatNumber}`;
        return s.seatId;
      });

      return res.json({ success: true, occupiedSeats: occupied });
    }

    return res.json({ success: true, occupiedSeats: ['B4', 'B5', 'C6', 'C7', 'D3', 'D4', 'E4'] });
  } catch (err) { next(err); }
});

// Customer: Create or confirm booking from customer checkout
router.post('/', optionalAuthenticate, async (req, res, next) => {
  try {
    const {
      mediaId,
      theatreName,
      date,
      time,
      seats = [],
      totalAmount,
      customerName = 'Marcus Levin',
      customerEmail = 'customer@cinepass.com',
      showId: directShowId,
      seatIds: directSeatIds
    } = req.body;

    // Resolve Customer User
    let userId = req.user?.id;
    if (!userId) {
      let existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: customerEmail },
            { role: 'CUSTOMER' }
          ]
        }
      });
      if (!existingUser) {
        existingUser = await prisma.user.create({
          data: {
            fullName: customerName,
            email: customerEmail,
            role: 'CUSTOMER',
            passwordHash: 'guest_authenticated_checkout'
          }
        });
      }
      userId = existingUser.id;
    }

    // Resolve Show
    let show = null;
    if (directShowId) {
      show = await prisma.show.findUnique({
        where: { id: directShowId },
        include: { movie: true, screen: true, theatre: true }
      });
    }

    if (!show && theatreName) {
      show = await prisma.show.findFirst({
        where: {
          theatre: { name: { contains: theatreName, mode: 'insensitive' } }
        },
        include: { movie: true, screen: true, theatre: true }
      });
    }

    if (!show && mediaId) {
      show = await prisma.show.findFirst({
        where: {
          movie: {
            OR: [
              { id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mediaId) ? mediaId : undefined },
              { title: { contains: mediaId.replace(/[-_]/g, ' '), mode: 'insensitive' } }
            ].filter(Boolean)
          }
        },
        include: { movie: true, screen: true, theatre: true }
      });
    }

    if (!show) {
      show = await prisma.show.findFirst({
        include: { movie: true, screen: true, theatre: true }
      });
    }

    const bookingReference = 'CV' + Math.floor(10000000 + Math.random() * 90000000);
    const amountVal = Number(totalAmount) || 76.0;
    const amountCents = Math.round(amountVal * 100);

    // Save real booking in PostgreSQL
    let createdBooking = null;
    if (show) {
      createdBooking = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.create({
          data: {
            bookingReference,
            userId,
            showId: show.id,
            subtotalCents: amountCents,
            totalAmountCents: amountCents,
            status: 'CONFIRMED',
            qrScanStatus: 'UNUSED'
          }

        });

        // Record payment
        await tx.payment.create({
          data: {
            bookingId: b.id,
            amountCents,
            paymentMethod: 'MOCK_CARD',
            status: 'SUCCESS',
            paymentReference: 'PAY-' + bookingReference
          }
        });

        // Resolve seats & update status to BOOKED
        const seatList = directSeatIds && directSeatIds.length > 0 ? directSeatIds : seats;
        for (const s of seatList) {
          const match = typeof s === 'string' ? s.match(/^([A-Za-z]+)(\d+)$/) : null;
          let seatRecord = null;
          if (match) {
            seatRecord = await tx.seat.findFirst({
              where: {
                screenId: show.screenId,
                rowLabel: match[1].toUpperCase(),
                seatNumber: parseInt(match[2], 10)
              }
            });
          } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) {
            seatRecord = await tx.seat.findUnique({ where: { id: s } });
          }

          if (seatRecord) {
            await tx.bookingSeat.create({
              data: {
                bookingId: b.id,
                seatId: seatRecord.id,
                allocatedPriceCents: Math.round(amountCents / Math.max(1, seatList.length))
              }
            });

            await tx.showSeatStatus.upsert({
              where: {
                showId_seatId: {
                  showId: show.id,
                  seatId: seatRecord.id
                }
              },
              update: {
                status: 'BOOKED',
                lockedByUserId: null,
                lockExpiresAt: null
              },
              create: {
                showId: show.id,
                seatId: seatRecord.id,
                status: 'BOOKED'
              }
            });
          }
        }

        return b;
      });

      // Broadcast booked seats via Socket.IO
      for (const s of seats) {
        io.to(`show:${show.id}`).emit('seat:booked', { seatLabel: s, showId: show.id });
      }
    }

    const finalRecord = {
      orderId: bookingReference,
      mediaId: mediaId || show?.movie?.id || 'the-batman',
      theatreName: theatreName || show?.theatre?.name || 'IMAX Pavilion Elite KL',
      date: date || 'Tomorrow, Oct 8',
      time: time || '06:30 PM',
      seats: seats.length > 0 ? seats : ['E7', 'E8'],
      totalAmount: amountVal,
      customerName,
      customerEmail,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      qrCodeData: `https://cinepass.my/verify/${bookingReference}`,
      title: show?.movie?.title || 'The Batman',
      posterImage: show?.movie?.posterUrl || '/images/movies/the-batman.jpg'
    };

    res.status(201).json({
      success: true,
      orderId: bookingReference,
      booking: finalRecord,
      dbBookingId: createdBooking?.id
    });
  } catch (err) { next(err); }
});

// List bookings: If customer, return their bookings; if manager, return theatre bookings
router.get('/', optionalAuthenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (req.user?.role === 'THEATRE_MANAGER' && req.user.theatreId) {
      const bookings = await prisma.booking.findMany({
        where: { show: { theatreId: req.user.theatreId } },
        include: {
          user: { select: { id: true, fullName: true, email: true, mobileNumber: true } },
          show: { include: { movie: true, screen: true } },
          seats: { include: { seat: true } },
          payments: true
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      });
      return res.json({ success: true, data: bookings });
    }

    // Default to user's bookings
    const where = userId ? { userId } : {};
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        show: { include: { movie: true, screen: true, theatre: true } },
        seats: { include: { seat: true } },
        payments: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const formatted = bookings.map(b => ({
      orderId: b.bookingReference,
      mediaId: b.show?.movie?.id || 'movie',
      title: b.show?.movie?.title || 'Cinema Ticket',
      theatreName: b.show?.theatre?.name || 'CineVerse Theatre',
      date: b.show?.startTime ? new Date(b.show.startTime).toLocaleDateString() : 'Today',
      time: b.show?.startTime ? new Date(b.show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:30 PM',
      seats: b.seats?.map(s => s.seat ? `${s.seat.rowLabel}${s.seat.seatNumber}` : s.seatId) || [],
      totalAmount: (b.totalAmountCents || 0) / 100,
      status: b.status,
      posterImage: b.show?.movie?.posterUrl || '/images/movies/the-batman.jpg',
      createdAt: b.createdAt.toISOString(),
      qrCodeData: `https://cinepass.my/verify/${b.bookingReference}`
    }));

    res.json(formatted);
  } catch (err) { next(err); }
});

// Authenticated user's bookings with rich relations
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        show: { include: { movie: true, screen: true, theatre: true } },
        seats: { include: { seat: true } },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: bookings });
  } catch (err) { next(err); }
});

// ==========================================
// 2. Manager & Staff Booking Endpoints
// ==========================================

// Manager: Get all bookings for their theatre's shows
router.get('/theatre', authenticate, requirePermission(['VIEW_BOOKINGS', 'MANAGE_BOOKINGS', 'MANAGE_THEATRE']), enforceTenantScope, async (req, res, next) => {
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

// Initiate formal transactional booking
router.post('/initiate', authenticate, requirePermission(['BOOK_TICKETS', 'MANAGE_BOOKINGS']), async (req, res, next) => {
  try {
    const { showId, seatIds } = req.body;
    const userId = req.user.id;
    const now = new Date();

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

    const show = await prisma.show.findUnique({ where: { id: showId } });
    if (!show) throw new AppError(404, 'Show not found');

    const seatRecords = await prisma.seat.findMany({
      where: { id: { in: seatIds } }
    });

    const pricing = (typeof show.baseTierPricing === 'object' && show.baseTierPricing !== null)
      ? show.baseTierPricing
      : { NORMAL: 250, PREMIUM: 380, RECLINER: 550 };

    let calculatedSubtotal = 0;
    const seatAllocations = seatRecords.map(seat => {
      const unitPrice = Number(pricing[seat.tier] || pricing.NORMAL || 250);
      calculatedSubtotal += unitPrice;
      return {
        seatId: seat.id,
        allocatedPriceCents: unitPrice
      };
    });

    const bookingReference = 'CV' + Math.floor(10000000 + Math.random() * 90000000);

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          bookingReference,
          userId,
          showId,
          subtotalCents: calculatedSubtotal,
          totalAmountCents: calculatedSubtotal,
          status: 'INITIATED',
          seats: {
            create: seatAllocations
          }
        },
        include: { seats: true }
      });
      return b;
    });

    res.status(201).json({ success: true, data: booking });
  } catch (err) { next(err); }
});

// Mock payment endpoint
router.post('/:id/mock-payment', authenticate, requirePermission(['BOOK_TICKETS', 'MANAGE_BOOKINGS']), async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { seats: true }
    });

    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.userId !== userId) throw new AppError(403, 'Unauthorized');
    if (booking.status !== 'INITIATED') throw new AppError(400, 'Booking is not in INITIATED state');

    if (status === 'SUCCESS') {
      await prisma.$transaction(async (tx) => {
        const sortedSeatIds = booking.seats.map(s => s.seatId).sort();

        for (const seatId of sortedSeatIds) {
          const rows = await tx.$queryRaw`
            SELECT id, status, locked_by_user_id, lock_expires_at 
            FROM show_seat_status 
            WHERE show_id = ${booking.showId}::uuid AND seat_id = ${seatId}::uuid 
            FOR UPDATE
          `;
          
          if (rows.length === 0) {
            throw new AppError(404, 'Seat status not found');
          }

          const seatStatus = rows[0];

          if (seatStatus.locked_by_user_id !== userId) {
            throw new AppError(409, 'Lock lost before payment completion');
          }

          await tx.$queryRaw`
            UPDATE show_seat_status
            SET status = 'BOOKED', locked_by_user_id = NULL, lock_expires_at = NULL
            WHERE id = ${seatStatus.id}::uuid
          `;
        }

        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'CONFIRMED' }
        });

        await tx.payment.create({
          data: {
            bookingId,
            amountCents: booking.totalAmountCents,
            paymentMethod: 'MOCK_CARD',
            status: 'SUCCESS',
            paymentReference: 'PAY-' + Math.floor(10000000 + Math.random() * 90000000)
          }
        });
      });

      for (const bs of booking.seats) {
        io.to(`show:${booking.showId}`).emit('seat:booked', { seatId: bs.seatId, userId });
      }

      res.json({ success: true, message: 'Payment successful, tickets booked' });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'FAILED' }
        });

        for (const bs of booking.seats) {
          const rows = await tx.$queryRaw`
            SELECT id, locked_by_user_id, lock_expires_at 
            FROM show_seat_status 
            WHERE show_id = ${booking.showId}::uuid AND seat_id = ${bs.seatId}::uuid 
            FOR UPDATE
          `;
          
          if (rows.length > 0) {
             const seatStatus = rows[0];
             if (seatStatus.locked_by_user_id === userId) {
               await tx.$queryRaw`
                 UPDATE show_seat_status
                 SET locked_by_user_id = NULL, lock_expires_at = NULL
                 WHERE id = ${seatStatus.id}::uuid
               `;
             }
          }
        }
      });
      
      for (const bs of booking.seats) {
        io.to(`show:${booking.showId}`).emit('seat:released', { seatId: bs.seatId });
      }

      res.json({ success: false, message: 'Payment failed' });
    }
  } catch (err) { next(err); }
});

// Customer: Cancel confirmed booking
router.post('/:id/cancel', authenticate, async (req, res, next) => {
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
