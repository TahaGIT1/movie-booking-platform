import { Router } from 'express';

const router = Router();

// Define module routes here
// router.use('/auth', authRoutes);
// router.use('/admin/movies', adminMovieRoutes);
// etc.

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;
