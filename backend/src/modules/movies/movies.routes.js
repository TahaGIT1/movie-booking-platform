import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const router = Router();

router.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const movies = await prisma.movie.findMany({ where: { title: { contains: q, mode: 'insensitive' } } });
    res.json({ success: true, data: movies });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const movies = await prisma.movie.findMany();
    res.json({ success: true, data: movies });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const movie = await prisma.movie.findUnique({ where: { id: req.params.id }, include: { shows: { include: { theatre: true } } } });
    if (!movie) throw new AppError(404, 'Movie not found', 'NOT_FOUND');
    res.json({ success: true, data: movie });
  } catch (err) { next(err); }
});

export default router;
