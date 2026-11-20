import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { createShowSchema } from './shows.schema.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { io } from '../../socket.js';

const router = Router();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Public: Query shows by movie, city, or date
router.get('/public', async (req, res, next) => {
  try {
    const { movieId, city, date } = req.query;
    const where = { isCancelled: false };
    if (movieId) where.movieId = movieId;
    if (city && city !== 'All Cities' && city !== 'All') {
      where.theatre = { city: { equals: city, mode: 'insensitive' } };
    }
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.startTime = { gte: startOfDay, lte: endOfDay };
    } else {
      where.startTime = { gte: new Date() };
    }

    const shows = await prisma.show.findMany({
      where,
      include: {
        movie: true,
        theatre: true,
        screen: true
      },
      orderBy: { startTime: 'asc' }
    });
    res.json({ success: true, data: shows });
  } catch (err) { next(err); }
});

// Public: Get seats & their real-time hold status for a show
router.get('/:id/seats', async (req, res, next) => {
  try {
    const showId = req.params.id;
    const seats = await prisma.showSeatStatus.findMany({
      where: { showId },
      include: { seat: true }
    });
    
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

// Public: Get single show details by ID (with screen, movie, theatre)
router.get('/:id', async (req, res, next) => {
  try {
    const show = await prisma.show.findUnique({
      where: { id: req.params.id },
      include: {
        movie: true,
        theatre: true,
        screen: {
          include: {
            seats: {
              orderBy: [{ rowLabel: 'asc' }, { seatNumber: 'asc' }]
            }
          }
        }
      }
    });
    if (!show) throw new AppError(404, 'Show session not found');
    res.json({ success: true, data: show });
  } catch (err) { next(err); }
});

// Get user's active seat hold if any (across any show/theatre)
router.get('/my-active-hold', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const activeHolds = await prisma.showSeatStatus.findMany({
      where: {
        lockedByUserId: userId,
        lockExpiresAt: { gt: now }
      },
      include: {
        show: {
          include: {
            movie: { select: { id: true, title: true, posterUrl: true } },
            theatre: { select: { id: true, name: true, city: true } }
          }
        },
        seat: true
      }
    });

    if (activeHolds.length === 0) {
      return res.json({ success: true, data: { hasActiveHold: false } });
    }

    const first = activeHolds[0];
    const show = first.show;
    const lockExpiresAt = activeHolds.reduce(
      (earliest, h) => (h.lockExpiresAt && (!earliest || h.lockExpiresAt < earliest) ? h.lockExpiresAt : earliest),
      null
    );

    res.json({
      success: true,
      data: {
        hasActiveHold: true,
        showId: show.id,
        movieId: show.movie?.id,
        movieTitle: show.movie?.title,
        theatreId: show.theatre?.id,
        theatreName: show.theatre?.name,
        city: show.theatre?.city,
        seatIds: activeHolds.map((h) => h.seatId),
        seatLabels: activeHolds.map((h) => `${h.seat?.rowLabel}${h.seat?.seatNumber}`),
        lockExpiresAt
      }
    });
  } catch (err) {
    next(err);
  }
});

// Release all active seat holds held by the authenticated user across all shows/theatres
router.post('/release-all-holds', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const activeHolds = await prisma.showSeatStatus.findMany({
      where: {
        lockedByUserId: userId,
        lockExpiresAt: { gt: now }
      },
      select: { id: true, showId: true, seatId: true }
    });

    if (activeHolds.length > 0) {
      await prisma.showSeatStatus.updateMany({
        where: {
          id: { in: activeHolds.map((h) => h.id) }
        },
        data: {
          lockedByUserId: null,
          lockExpiresAt: null
        }
      });

      for (const hold of activeHolds) {
        io.to(`show:${hold.showId}`).emit('seat:released', { seatId: hold.seatId });
      }
    }

    res.json({
      success: true,
      message: 'All active seat holds released successfully',
      releasedCount: activeHolds.length
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/seats/lock', authenticate, requirePermission('BOOK_TICKETS'), async (req, res, next) => {
  try {
    const showId = req.params.id;
    const { seatIds } = req.body;
    const userId = req.user.id;
    const now = new Date();
    const expiryTime = new Date(now.getTime() + 300 * 1000); // 5 minutes from now

    // 1. Enforce seat count validation (1 to 6 seats)
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      throw new AppError(400, 'Please select at least one seat', 'NO_SEATS_SELECTED');
    }

    if (seatIds.length > 6) {
      throw new AppError(400, 'You can select a maximum of 6 seats at a single time', 'MAX_SEATS_EXCEEDED');
    }

    const isUuid = UUID_PATTERN.test(showId);
    if (isUuid) {
      try {
        await prisma.$transaction(async (tx) => {
          // 2. Enforce cross-show / cross-theatre lock restriction:
          const activeOtherHolds = await tx.showSeatStatus.findMany({
            where: {
              lockedByUserId: userId,
              lockExpiresAt: { gt: now },
              showId: { not: showId }
            },
            include: {
              show: {
                include: {
                  movie: { select: { title: true } },
                  theatre: { select: { name: true, city: true } }
                }
              }
            }
          });

          if (activeOtherHolds.length > 0) {
            const otherShow = activeOtherHolds[0].show;
            const otherMovieTitle = otherShow?.movie?.title || 'Another Movie';
            const otherTheatreName = otherShow?.theatre?.name || 'Another Cinema';

            throw new AppError(
              409,
              `You currently have seats on hold for "${otherMovieTitle}" at ${otherTheatreName}. You cannot select seats on another show or theatre while holding seats. Please complete or release that booking first.`,
              'ACTIVE_HOLD_ON_ANOTHER_SHOW',
              {
                otherShowId: otherShow?.id,
                otherMovie: otherMovieTitle,
                otherTheatre: otherTheatreName
              }
            );
          }

          // 3. Acquire seat locks. A conditional update replaces SELECT ... FOR UPDATE:
          // it only matches an AVAILABLE seat that is unlocked, already ours, or whose
          // lock has expired, and MongoDB aborts the transaction on a concurrent write.
          const sortedSeatIds = [...seatIds].sort();

          for (const seatId of sortedSeatIds) {
            if (!UUID_PATTERN.test(seatId)) continue;

            const { count } = await tx.showSeatStatus.updateMany({
              where: {
                showId,
                seatId,
                status: 'AVAILABLE',
                OR: [
                  { lockedByUserId: null },
                  { lockedByUserId: { isSet: false } },
                  { lockedByUserId: userId },
                  { lockExpiresAt: { lte: now } }
                ]
              },
              data: { lockedByUserId: userId, lockExpiresAt: expiryTime }
            });
            if (count === 1) continue;

            const seatStatus = await tx.showSeatStatus.findUnique({
              where: { showId_seatId: { showId, seatId } },
              select: { status: true }
            });
            if (!seatStatus) continue;
            if (seatStatus.status !== 'AVAILABLE') {
              throw new AppError(409, 'Seat is not available', 'SEAT_UNAVAILABLE', { seatId });
            }
            throw new AppError(409, 'Seat already locked by another customer', 'SEAT_LOCKED', { seatId });
          }
        });
      } catch (txErr) {
        if (txErr instanceof AppError) throw txErr;
        // Do not report "Seats locked" when the database never stored the lock.
        console.error('[Shows] Seat lock transaction failed:', txErr);
        throw new AppError(503, 'Could not hold these seats right now. Please try again.', 'SEAT_LOCK_FAILED');
      }
    }

    for (const seatId of seatIds) {
      io.to(`show:${showId}`).emit('seat:locked', { seatId, userId, lockExpiresAt: expiryTime });
    }

    res.json({ success: true, message: 'Seats locked', lockExpiresAt: expiryTime });
  } catch (err) { next(err); }
});

router.post('/:id/seats/release', authenticate, requirePermission('BOOK_TICKETS'), async (req, res, next) => {
  try {
    const showId = req.params.id;
    const { seatIds } = req.body;
    const userId = req.user.id;

    const isUuid = UUID_PATTERN.test(showId);
    if (isUuid) {
      try {
        const releasableSeatIds = (Array.isArray(seatIds) ? seatIds : []).filter(id => UUID_PATTERN.test(id));
        await prisma.showSeatStatus.updateMany({
          where: { showId, seatId: { in: releasableSeatIds }, lockedByUserId: userId },
          data: { lockedByUserId: null, lockExpiresAt: null }
        });
      } catch (txErr) {
        console.warn('[Shows] DB release transaction skipped or offline:', txErr.message);
      }
    }

    for (const seatId of seatIds) {
      io.to(`show:${showId}`).emit('seat:released', { seatId });
    }

    res.json({ success: true, message: 'Seats released' });
  } catch (err) { next(err); }
});

// Manager route: List shows for manager's theatre
router.get('/', authenticate, requirePermission(['MANAGE_SHOWS', 'CREATE_SHOW']), enforceTenantScope, async (req, res, next) => {
  try {
    const { date, screenId, movieId } = req.query;
    const where = { theatreId: req.tenantId };
    
    if (screenId) where.screenId = screenId;
    if (movieId) where.movieId = movieId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.startTime = { gte: startOfDay, lte: endOfDay };
    }

    const shows = await prisma.show.findMany({
      where,
      include: {
        movie: true,
        screen: true,
        _count: { select: { bookings: true } }
      },
      orderBy: { startTime: 'desc' }
    });

    res.json({ success: true, data: shows });
  } catch (err) { next(err); }
});

// Manager: Create new show
router.post('/', authenticate, requirePermission(['CREATE_SHOW', 'MANAGE_SHOWS']), enforceTenantScope, validateRequest(createShowSchema), async (req, res, next) => {
  try {
    const data = { ...req.body };
    data.startTime = new Date(data.startTime);
    data.endTime = new Date(data.endTime);
    data.theatreId = req.tenantId;

    if (data.startTime >= data.endTime) throw new AppError(400, 'Invalid time range: start time must be before end time');

    const overlap = await prisma.show.findFirst({
      where: {
        screenId: data.screenId,
        isCancelled: false,
        OR: [
          { AND: [{ startTime: { lte: data.startTime } }, { endTime: { gt: data.startTime } }] },
          { AND: [{ startTime: { lt: data.endTime } }, { endTime: { gte: data.endTime } }] },
          { AND: [{ startTime: { gte: data.startTime } }, { endTime: { lte: data.endTime } }] }
        ]
      }
    });

    if (overlap) {
      throw new AppError(409, 'Show time overlaps with an existing show on this screen', 'SHOW_OVERLAP');
    }

    const show = await prisma.show.create({
      data,
      include: { movie: true, screen: true }
    });
    
    // Create show_seat_status for all seats in this screen
    const seats = await prisma.seat.findMany({ where: { screenId: data.screenId } });
    if (seats.length > 0) {
      const seatStatuses = seats.map(s => ({ showId: show.id, seatId: s.id, status: s.isBroken ? 'UNAVAILABLE' : 'AVAILABLE' }));
      await prisma.showSeatStatus.createMany({ data: seatStatuses, skipDuplicates: true });
    }
    
    res.status(201).json({ success: true, data: show, message: 'Show scheduled successfully' });
  } catch (err) { next(err); }
});

// Manager: Batch update pricing for all scheduled shows of a movie
router.patch('/movie/:movieId/pricing', authenticate, requirePermission(['MANAGE_SHOWS', 'CREATE_SHOW']), enforceTenantScope, async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { baseTierPricing } = req.body;
    if (!baseTierPricing) throw new AppError(400, 'baseTierPricing is required');

    const result = await prisma.show.updateMany({
      where: {
        theatreId: req.tenantId,
        movieId,
        isCancelled: false
      },
      data: { baseTierPricing }
    });

    res.json({
      success: true,
      count: result.count,
      message: `Successfully updated ticket pricing for ${result.count} show session(s)`
    });
  } catch (err) { next(err); }
});

// Manager: Update show details or ticket pricing
router.patch('/:id', authenticate, requirePermission(['MANAGE_SHOWS', 'CREATE_SHOW']), enforceTenantScope, async (req, res, next) => {
  try {
    const show = await prisma.show.findUnique({ where: { id: req.params.id } });
    if (!show || show.theatreId !== req.tenantId) throw new AppError(404, 'Show not found in your cinema branch');

    const { baseTierPricing, languageVersion, visualFormat, updateAllMovieShows } = req.body;

    // If requested, also cascade the new pricing to all other scheduled shows of this movie in the manager's theatre
    if (updateAllMovieShows && baseTierPricing) {
      await prisma.show.updateMany({
        where: {
          theatreId: req.tenantId,
          movieId: show.movieId,
          isCancelled: false
        },
        data: { baseTierPricing }
      });
    }

    const updated = await prisma.show.update({
      where: { id: req.params.id },
      data: {
        ...(baseTierPricing !== undefined && { baseTierPricing }),
        ...(languageVersion && { languageVersion }),
        ...(visualFormat && { visualFormat })
      },
      include: { movie: true, screen: true, _count: { select: { bookings: true } } }
    });

    res.json({ success: true, data: updated, message: 'Ticket pricing updated successfully' });
  } catch (err) { next(err); }
});

// Manager: Cancel a show
router.patch('/:id/cancel', authenticate, requirePermission(['MANAGE_SHOWS', 'CREATE_SHOW']), enforceTenantScope, async (req, res, next) => {
  try {
    const show = await prisma.show.findUnique({ where: { id: req.params.id } });
    if (!show || show.theatreId !== req.tenantId) throw new AppError(404, 'Show not found');

    const updated = await prisma.show.update({
      where: { id: req.params.id },
      data: { isCancelled: true }
    });

    res.json({ success: true, data: updated, message: 'Show marked as cancelled' });
  } catch (err) { next(err); }
});

// Manager: Delete a show if no bookings
router.delete('/:id', authenticate, requirePermission(['MANAGE_SHOWS', 'CREATE_SHOW']), enforceTenantScope, async (req, res, next) => {
  try {
    const show = await prisma.show.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { bookings: true } } }
    });
    if (!show || show.theatreId !== req.tenantId) throw new AppError(404, 'Show not found');

    if (show._count.bookings > 0) {
      throw new AppError(400, 'Cannot delete a show that already has customer bookings. Cancel it instead.');
    }

    await prisma.showSeatStatus.deleteMany({ where: { showId: req.params.id } });
    await prisma.show.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'Show deleted successfully' });
  } catch (err) { next(err); }
});

export default router;
