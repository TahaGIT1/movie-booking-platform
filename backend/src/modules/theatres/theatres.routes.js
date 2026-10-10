import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { createTheatreSchema } from './theatres.schema.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const router = Router();

// Manager routes for their own theatre
router.post('/', authenticate, requirePermission('MANAGE_THEATRE'), validateRequest(createTheatreSchema), async (req, res, next) => {
  try {
    const theatre = await prisma.theatre.create({ data: req.body });
    // Link user to this theatre
    await prisma.user.update({ where: { id: req.user.id }, data: { theatreId: theatre.id } });
    res.status(201).json({ success: true, data: theatre });
  } catch (err) { next(err); }
});

router.get('/my', authenticate, requirePermission('MANAGE_THEATRE'), async (req, res, next) => {
  try {
    if (!req.user.theatreId) {
      return res.status(200).json({ success: true, data: null, message: 'No theatre associated' });
    }
    const theatre = await prisma.theatre.findUnique({
      where: { id: req.user.theatreId },
      include: {
        documents: true,
        screens: {
          include: {
            _count: { select: { seats: true, shows: true } }
          },
          orderBy: { screenNumber: 'asc' }
        }
      }
    });
    res.json({ success: true, data: theatre });
  } catch (err) { next(err); }
});

router.patch('/my', authenticate, requirePermission('MANAGE_THEATRE'), async (req, res, next) => {
  try {
    if (!req.user.theatreId) throw new AppError(400, 'User is not linked to any theatre');
    const {
      name,
      legalEntityName,
      contactPhone,
      contactEmail,
      addressLine,
      city,
      state,
      postalCode,
      amenities
    } = req.body;

    const updated = await prisma.theatre.update({
      where: { id: req.user.theatreId },
      data: {
        ...(name && { name }),
        ...(legalEntityName !== undefined && { legalEntityName }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(addressLine && { addressLine }),
        ...(city && { city }),
        ...(state && { state }),
        ...(postalCode !== undefined && { postalCode }),
        ...(amenities !== undefined && { amenities })
      }
    });

    res.json({ success: true, data: updated, message: 'Theatre profile updated successfully' });
  } catch (err) { next(err); }
});

router.get('/my/analytics', authenticate, requirePermission(['VIEW_REPORTS', 'MANAGE_THEATRE']), async (req, res, next) => {
  try {
    const theatreId = req.user.theatreId;
    if (!theatreId) throw new AppError(400, 'User is not linked to any theatre');

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [theatre, screens, todayShows, confirmedBookings, allBookingsCount] = await Promise.all([
      prisma.theatre.findUnique({ where: { id: theatreId } }),
      prisma.screen.findMany({
        where: { theatreId },
        include: { _count: { select: { seats: true } } }
      }),
      prisma.show.findMany({
        where: {
          theatreId,
          startTime: { gte: startOfToday, lte: endOfToday }
        },
        include: {
          movie: true,
          screen: true,
          _count: { select: { bookings: true } }
        },
        orderBy: { startTime: 'asc' }
      }),
      prisma.booking.findMany({
        where: {
          show: { theatreId },
          status: 'CONFIRMED'
        },
        include: {
          user: { select: { fullName: true, email: true } },
          show: { include: { movie: true, screen: true } },
          seats: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.booking.count({
        where: { show: { theatreId } }
      })
    ]);

    const totalSeats = screens.reduce((sum, s) => sum + (s._count?.seats || s.totalCapacity || 0), 0);
    const grossRevenueCents = confirmedBookings.reduce((sum, b) => sum + (b.totalAmountCents || 0), 0);
    const totalBookedSeats = confirmedBookings.reduce((sum, b) => sum + (b.seats?.length || 0), 0);
    const occupancyRate = totalSeats > 0 ? Math.min(100, Math.round((totalBookedSeats / (totalSeats * Math.max(1, todayShows.length))) * 100)) : 0;

    res.json({
      success: true,
      data: {
        theatreStatus: theatre?.status || 'PENDING',
        totalScreens: screens.length,
        totalSeats,
        activeShowsToday: todayShows.length,
        totalBookings: allBookingsCount,
        confirmedBookingsCount: confirmedBookings.length,
        grossRevenueCents,
        occupancyRate,
        todayShows,
        recentBookings: confirmedBookings
      }
    });
  } catch (err) { next(err); }
});

// Public customer routes
router.get('/', async (req, res, next) => {
  try {
    const theatres = await prisma.theatre.findMany({ where: { status: 'ACTIVE' } });
    res.json({ success: true, data: theatres });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const theatre = await prisma.theatre.findUnique({
      where: { id: req.params.id },
      include: { screens: true }
    });
    if (!theatre) throw new AppError(404, 'Theatre not found');
    res.json({ success: true, data: theatre });
  } catch (err) { next(err); }
});

router.get('/:id/shows', async (req, res, next) => {
  try {
    const shows = await prisma.show.findMany({
      where: { screen: { theatreId: req.params.id }, startTime: { gte: new Date() } },
      include: { movie: true, screen: true },
      orderBy: { startTime: 'asc' }
    });
    res.json({ success: true, data: shows });
  } catch (err) { next(err); }
});

export default router;
