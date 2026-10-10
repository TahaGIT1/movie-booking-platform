import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import adminMovieRoutes from '../modules/admin/admin.movies.routes.js';
import adminTheatreRoutes from '../modules/admin/admin.theatres.routes.js';
import movieRoutes from '../modules/movies/movies.routes.js';
import theatreRoutes from '../modules/theatres/theatres.routes.js';
import screenRoutes from '../modules/screens/screens.routes.js';
import showRoutes from '../modules/shows/shows.routes.js';
import bookingRoutes from '../modules/bookings/bookings.routes.js';
import staffRoutes from '../modules/staff/staff.routes.js';
import seatRoutes from '../modules/seats/seats.routes.js';
import adminAnalyticsRoutes from '../modules/admin/admin.analytics.routes.js';
import catalogRoutes from '../modules/catalog/catalog.routes.js';
import { prisma } from '../config/prisma.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin/movies', adminMovieRoutes);
router.use('/admin/theatres', adminTheatreRoutes);
router.use('/movies', movieRoutes);

// Manager portal scoped routes & Customer routes
router.use('/manager/theatre', theatreRoutes);
router.use('/theatres', theatreRoutes);
router.use('/manager/analytics', adminAnalyticsRoutes);
router.use('/manager/screens', screenRoutes);
router.use('/screens', screenRoutes);
router.use('/manager/seats', seatRoutes);
router.use('/manager/shows', showRoutes);
router.use('/shows', showRoutes);
router.use('/manager/bookings', bookingRoutes);
router.use('/bookings', bookingRoutes);
router.use('/manager/staff', staffRoutes);
router.use('/staff', staffRoutes);

// Customer Discovery & Catalog routes (Events, Streams, Plays, Sports, Activities, Offers)
router.use('/', catalogRoutes);

// Global unified search
router.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const [movies, theatres] = await Promise.all([
      prisma.movie.findMany({
        where: { title: { contains: q, mode: 'insensitive' } },
        take: 10
      }),
      prisma.theatre.findMany({
        where: { name: { contains: q, mode: 'insensitive' }, status: { in: ['ACTIVE', 'APPROVED'] } },
        take: 10
      })
    ]);
    res.json({ success: true, movies, theatres });
  } catch (err) { next(err); }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export default router;
