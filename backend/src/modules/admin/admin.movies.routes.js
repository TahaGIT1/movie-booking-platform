import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { createMovieSchema } from '../movies/movies.schema.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const router = Router();

router.use(authenticate, requirePermission('CREATE_MOVIE'));

router.post('/', validateRequest(createMovieSchema), async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.releaseDate) data.releaseDate = new Date(data.releaseDate);
    const movie = await prisma.movie.create({ data });
    res.status(201).json({ success: true, data: movie });
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
    const movie = await prisma.movie.findUnique({ where: { id: req.params.id } });
    if (!movie) throw new AppError(404, 'Movie not found', 'NOT_FOUND');
    res.json({ success: true, data: movie });
  } catch (err) { next(err); }
});

router.put('/:id', validateRequest(createMovieSchema.partial()), async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.releaseDate) data.releaseDate = new Date(data.releaseDate);
    const movie = await prisma.movie.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: movie });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.movie.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
});

export default router;