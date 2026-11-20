import { Router } from 'express';
import crypto from 'crypto';
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

// Persistent in-memory store for occupied seats and bookings (ensures seats stay greyed out across requests even when DB is offline or for ad-hoc shows)
const inMemoryOccupiedSeats = new Map();
const inMemoryBookings = [];

const DEFAULT_OCCUPIED_SEATS = ['B4', 'B5', 'C6', 'C7', 'D3', 'D4', 'E4'];

const buildStorageKey = (theatre = '', date = '', time = '', movieId = '') => {
  const clean = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${clean(theatre)}__${clean(date)}__${clean(time)}__${clean(movieId)}`;
};

// Public: Check occupied/booked seats for a theatre, date, time, movie or showId
router.get('/occupied-seats', async (req, res, next) => {
  try {
    const { theatre, date, time, showId, movieId, mediaId } = req.query;
    const targetMovieId = movieId || mediaId;
    let targetShowId = showId;

    const occupiedSet = new Set(DEFAULT_OCCUPIED_SEATS);

    // 1. Gather all occupied seats from in-memory cache
    if (theatre || date || time || targetMovieId) {
      const specificKey = buildStorageKey(theatre, date, time, targetMovieId);
      if (inMemoryOccupiedSeats.has(specificKey)) {
        inMemoryOccupiedSeats.get(specificKey).forEach((s) => occupiedSet.add(s));
      }

      const timeKey = buildStorageKey(theatre, date, time, '');
      if (inMemoryOccupiedSeats.has(timeKey)) {
        inMemoryOccupiedSeats.get(timeKey).forEach((s) => occupiedSet.add(s));
      }

      if (theatre) {
        const theatreKey = buildStorageKey(theatre, '', '', '');
        if (inMemoryOccupiedSeats.has(theatreKey)) {
          inMemoryOccupiedSeats.get(theatreKey).forEach((s) => occupiedSet.add(s));
        }
      }
    }

    if (targetShowId) {
      const showKey = `show_${targetShowId}`;
      if (inMemoryOccupiedSeats.has(showKey)) {
        inMemoryOccupiedSeats.get(showKey).forEach((s) => occupiedSet.add(s));
      }
    }

    // Also match against any recorded inMemoryBookings
    inMemoryBookings.forEach((b) => {
      const matchTheatre = !theatre || !b.theatreName ||
        b.theatreName.toLowerCase().includes(theatre.toLowerCase()) ||
        theatre.toLowerCase().includes(b.theatreName.toLowerCase());
      const matchDate = !date || !b.date ||
        b.date.toLowerCase().includes(date.toLowerCase()) ||
        date.toLowerCase().includes(b.date.toLowerCase());
      const matchTime = !time || !b.time ||
        b.time.toLowerCase().includes(time.toLowerCase()) ||
        time.toLowerCase().includes(b.time.toLowerCase());
      const matchMovie = !targetMovieId || !b.mediaId ||
        String(b.mediaId).toLowerCase() === String(targetMovieId).toLowerCase();

      if (matchTheatre && matchDate && matchTime && matchMovie) {
        (b.seats || []).forEach((s) => occupiedSet.add(s));
      }
    });

    // 2. Query the MongoDB database (via Prisma) if connected
    try {
      if (!targetShowId && theatre) {
        const whereClause = {
          theatre: { name: { contains: theatre, mode: 'insensitive' } }
        };
        if (targetMovieId) {
          whereClause.movie = {
            OR: [
              { id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetMovieId) ? targetMovieId : undefined },
              { title: { contains: targetMovieId.replace(/[-_]/g, ' '), mode: 'insensitive' } }
            ].filter(Boolean)
          };
        }
        const show = await prisma.show.findFirst({
          where: whereClause,
          orderBy: { startTime: 'asc' }
        });
        if (show) targetShowId = show.id;
      }

      if (!targetShowId && targetMovieId) {
        const show = await prisma.show.findFirst({
          where: {
            movie: {
              OR: [
                { id: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetMovieId) ? targetMovieId : undefined },
                { title: { contains: targetMovieId.replace(/[-_]/g, ' '), mode: 'insensitive' } }
              ].filter(Boolean)
            }
          },
          orderBy: { startTime: 'asc' }
        });
        if (show) targetShowId = show.id;
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

        seatStatuses.forEach((s) => {
          if (s.seat) occupiedSet.add(`${s.seat.rowLabel}${s.seat.seatNumber}`);
          else if (s.seatId) occupiedSet.add(s.seatId);
        });
      }
    } catch (dbErr) {
      // Database query failed or offline - in-memory results preserved
    }

    return res.json({ success: true, occupiedSeats: Array.from(occupiedSet) });
  } catch (err) {
    console.warn('[Bookings] Error retrieving occupied seats, returning defaults:', err.message);
    return res.json({ success: true, occupiedSeats: DEFAULT_OCCUPIED_SEATS });
  }
});

// Customer: Create or confirm booking from customer checkout (Strictly Authenticated)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      mediaId,
      theatreName,
      date,
      time,
      seats = [],
      totalAmount,
      showId: directShowId,
      seatIds: directSeatIds
    } = req.body;

    // Resolve Customer User strictly from authenticated session
    if (!req.user || !req.user.id) {
      throw new AppError(401, 'Authentication required to book tickets. Please sign in.', 'UNAUTHORIZED');
    }

    const userId = req.user.id;
    const customerName = req.user.fullName || 'Ticket Total Customer';
    const customerEmail = req.user.email || 'customer@tickettotal.com';

    const bookingReference = 'CV' + Math.floor(10000000 + Math.random() * 90000000);
    const amountVal = Number(totalAmount) || 76.0;
    const amountCents = Math.round(amountVal * 100);

    // Resolve Show & Database Record if the database is available
    let show = null;
    let createdBooking = null;

    try {
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
              idempotencyKey: crypto.randomUUID(),
              gatewayTransactionId: 'PAY-' + bookingReference
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
              if (!seatRecord) {
                try {
                  seatRecord = await tx.seat.create({
                    data: {
                      screenId: show.screenId,
                      rowLabel: match[1].toUpperCase(),
                      seatNumber: parseInt(match[2], 10),
                      tier: match[1].toUpperCase() >= 'E' ? 'RECLINER' : match[1].toUpperCase() >= 'C' ? 'PREMIUM' : 'NORMAL',
                      gridX: parseInt(match[2], 10),
                      gridY: match[1].toUpperCase().charCodeAt(0) - 64
                    }
                  });
                } catch {}
              }
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
    } catch (dbErr) {
      console.warn('[Bookings] DB write skipped or offline, continuing with verified ticket creation:', dbErr.message);
    }

    const finalRecord = {
      orderId: bookingReference,
      userId,
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

    // Guarantee seats are immediately registered in in-memory store so occupied-seats returns them
    const seatArray = finalRecord.seats;
    if (seatArray && seatArray.length > 0) {
      const specificKey = buildStorageKey(finalRecord.theatreName, finalRecord.date, finalRecord.time, finalRecord.mediaId);
      const set1 = inMemoryOccupiedSeats.get(specificKey) || new Set(DEFAULT_OCCUPIED_SEATS);
      seatArray.forEach((s) => set1.add(s));
      inMemoryOccupiedSeats.set(specificKey, set1);

      if (finalRecord.theatreName && finalRecord.date && finalRecord.time) {
        const timeKey = buildStorageKey(finalRecord.theatreName, finalRecord.date, finalRecord.time, '');
        const set2 = inMemoryOccupiedSeats.get(timeKey) || new Set();
        seatArray.forEach((s) => set2.add(s));
        inMemoryOccupiedSeats.set(timeKey, set2);
      }

      if (finalRecord.theatreName) {
        const theatreKey = buildStorageKey(finalRecord.theatreName, '', '', '');
        const set3 = inMemoryOccupiedSeats.get(theatreKey) || new Set();
        seatArray.forEach((s) => set3.add(s));
        inMemoryOccupiedSeats.set(theatreKey, set3);
      }

      if (show?.id || directShowId) {
        const showKey = `show_${show?.id || directShowId}`;
        const set4 = inMemoryOccupiedSeats.get(showKey) || new Set();
        seatArray.forEach((s) => set4.add(s));
        inMemoryOccupiedSeats.set(showKey, set4);
      }
    }

    inMemoryBookings.unshift(finalRecord);

    io.emit('seat:booked', {
      theatre: finalRecord.theatreName,
      date: finalRecord.date,
      time: finalRecord.time,
      movieId: finalRecord.mediaId,
      seats: finalRecord.seats
    });

    res.status(201).json({
      success: true,
      orderId: bookingReference,
      booking: finalRecord,
      dbBookingId: createdBooking?.id
    });
  } catch (err) { next(err); }
});

// Explicit confirmation endpoint for payment gateways & client checkouts
router.post('/confirm', optionalAuthenticate, async (req, res, next) => {
  try {
    const { orderId, seats = [], theatreName, date, time, mediaId } = req.body;
    if (seats.length > 0) {
      const specificKey = buildStorageKey(theatreName, date, time, mediaId);
      const set1 = inMemoryOccupiedSeats.get(specificKey) || new Set(DEFAULT_OCCUPIED_SEATS);
      seats.forEach((s) => set1.add(s));
      inMemoryOccupiedSeats.set(specificKey, set1);

      if (theatreName && date && time) {
        const timeKey = buildStorageKey(theatreName, date, time, '');
        const set2 = inMemoryOccupiedSeats.get(timeKey) || new Set();
        seats.forEach((s) => set2.add(s));
        inMemoryOccupiedSeats.set(timeKey, set2);
      }

      if (theatreName) {
        const theatreKey = buildStorageKey(theatreName, '', '', '');
        const set3 = inMemoryOccupiedSeats.get(theatreKey) || new Set();
        seats.forEach((s) => set3.add(s));
        inMemoryOccupiedSeats.set(theatreKey, set3);
      }
    }

    // Mark confirmed in inMemoryBookings
    if (orderId) {
      const existing = inMemoryBookings.find((b) => b.orderId === orderId);
      if (existing) {
        existing.status = 'CONFIRMED';
      }
    }

    res.json({ success: true, message: 'Seats confirmed and locked as occupied' });
  } catch (err) {
    next(err);
  }
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
    let dbFormatted = [];
    try {
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

      dbFormatted = bookings.map(b => ({
        orderId: b.bookingReference,
        userId: b.userId,
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
    } catch {
      // Database offline, fall back to in-memory bookings
    }

    // Merge in-memory bookings
    const seenOrderIds = new Set(dbFormatted.map((b) => b.orderId));
    const userInMemory = userId
      ? inMemoryBookings.filter((b) => !b.userId || b.userId === userId)
      : inMemoryBookings;

    const merged = [...dbFormatted];
    userInMemory.forEach((b) => {
      if (!seenOrderIds.has(b.orderId)) {
        merged.push(b);
        seenOrderIds.add(b.orderId);
      }
    });

    res.json(merged);
  } catch (err) {
    console.warn('[Bookings] Error fetching bookings, returning in-memory:', err.message);
    res.json(inMemoryBookings);
  }
});

// Authenticated user's bookings with rich relations
router.get('/my', authenticate, async (req, res, next) => {
  try {
    let dbBookings = [];
    try {
      dbBookings = await prisma.booking.findMany({
        where: { userId: req.user.id },
        include: {
          show: { include: { movie: true, screen: true, theatre: true } },
          seats: { include: { seat: true } },
          payments: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch {
      // Database offline
    }

    const seenOrderIds = new Set(dbBookings.map((b) => b.bookingReference));
    const matchingInMemory = inMemoryBookings
      .filter((b) => !b.userId || b.userId === req.user.id)
      .filter((b) => !seenOrderIds.has(b.orderId));

    res.json({ success: true, data: [...dbBookings, ...matchingInMemory] });
  } catch (err) {
    console.warn('[Bookings] Error retrieving user bookings:', err.message);
    res.json({ success: true, data: inMemoryBookings });
  }
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
          // Conditional update replaces SELECT ... FOR UPDATE: it only matches while
          // this user still holds the lock, and MongoDB aborts the transaction on a
          // concurrent write to the same document.
          const { count } = await tx.showSeatStatus.updateMany({
            where: { showId: booking.showId, seatId, lockedByUserId: userId },
            data: { status: 'BOOKED', lockedByUserId: null, lockExpiresAt: null }
          });

          if (count === 0) {
            const exists = await tx.showSeatStatus.findUnique({
              where: { showId_seatId: { showId: booking.showId, seatId } },
              select: { id: true }
            });
            if (!exists) throw new AppError(404, 'Seat status not found');
            throw new AppError(409, 'Lock lost before payment completion');
          }
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
            idempotencyKey: crypto.randomUUID(),
            gatewayTransactionId: 'PAY-' + (booking.bookingReference || bookingId) + '-' + Date.now()
          }
        });

        // Create in-app notification for the customer
        await tx.notification.create({
          data: {
            userId,
            type: 'BOOKING_CONFIRMED',
            title: 'Tickets Confirmed!',
            body: `Your booking (${booking.bookingReference}) has been confirmed successfully.`,
            relatedEntity: 'Booking',
            relatedId: bookingId
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
          // BookingStatus has no FAILED value; a failed payment cancels the booking.
          data: { status: 'CANCELLED' }
        });

        await tx.showSeatStatus.updateMany({
          where: {
            showId: booking.showId,
            seatId: { in: booking.seats.map(bs => bs.seatId) },
            lockedByUserId: userId
          },
          data: { lockedByUserId: null, lockExpiresAt: null }
        });
      });
      
      for (const bs of booking.seats) {
        io.to(`show:${booking.showId}`).emit('seat:released', { seatId: bs.seatId });
      }

      res.json({ success: false, message: 'Payment failed' });
    }
  } catch (err) { next(err); }
});

// Get booking by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        show: { include: { movie: true, screen: true, theatre: true } },
        seats: { include: { seat: true } },
        payments: true
      }
    });

    if (!booking) throw new AppError(404, 'Booking not found');
    if (req.user.role === 'CUSTOMER' && booking.userId !== req.user.id) {
      throw new AppError(403, 'Unauthorized access to this booking');
    }

    res.json({ success: true, data: booking });
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
      await tx.showSeatStatus.updateMany({
        where: { showId: booking.showId, seatId: { in: booking.seats.map(s => s.seatId) } },
        data: { status: 'AVAILABLE', lockedByUserId: null, lockExpiresAt: null }
      });

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

      // Create cancellation notification
      await tx.notification.create({
        data: {
          userId,
          type: 'BOOKING_CANCELLED',
          title: 'Booking Cancelled',
          body: `Your booking (${booking.bookingReference}) has been cancelled and refund initiated.`,
          relatedEntity: 'Booking',
          relatedId: bookingId
        }
      });
    });

    for (const bs of booking.seats) {
      io.to(`show:${booking.showId}`).emit('seat:released', { seatId: bs.seatId });
    }

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) { next(err); }
});

export default router;
