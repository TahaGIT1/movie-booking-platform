import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import adminMovieRoutes from '../modules/admin/admin.movies.routes.js';
import adminTheatreRoutes from '../modules/admin/admin.theatres.routes.js';
import adminUserRoutes from '../modules/admin/admin.users.routes.js';
import adminDashboardRoutes from '../modules/admin/admin.dashboard.routes.js';
import movieRoutes from '../modules/movies/movies.routes.js';
import theatreRoutes from '../modules/theatres/theatres.routes.js';
import screenRoutes from '../modules/screens/screens.routes.js';
import showRoutes from '../modules/shows/shows.routes.js';
import bookingRoutes from '../modules/bookings/bookings.routes.js';
import staffRoutes from '../modules/staff/staff.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/admin/movies', adminMovieRoutes);
router.use('/admin/theatres', adminTheatreRoutes);
router.use('/admin/users', adminUserRoutes);
router.use('/admin', adminDashboardRoutes);
router.use('/movies', movieRoutes);
router.use('/manager/theatre', theatreRoutes);
router.use('/manager/screens', screenRoutes);
router.use('/manager/shows', showRoutes);
router.use('/shows', showRoutes);
router.use('/bookings', bookingRoutes);
router.use('/staff', staffRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;
