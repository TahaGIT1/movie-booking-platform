import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const router = Router();

// Search movies by title
router.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const movies = await prisma.movie.findMany({
      where: {
        title: { contains: q, mode: 'insensitive' }
      },
      include: {
        shows: {
          include: { theatre: true, screen: true }
        }
      }
    });
    res.json({ success: true, data: movies });
  } catch (err) { next(err); }
});

// List all movies with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { search, genre } = req.query;
    const where = {};

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const movies = await prisma.movie.findMany({
      where,
      include: {
        shows: {
          include: { theatre: true, screen: true },
          orderBy: { startTime: 'asc' }
        }
      },
      orderBy: { releaseDate: 'desc' }
    });

    res.json({ success: true, data: movies });
  } catch (err) { next(err); }
});

// Get movie by ID or slug/title
router.get('/:id', async (req, res, next) => {
  try {
    const param = req.params.id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);

    let movie = null;
    if (isUuid) {
      movie = await prisma.movie.findUnique({
        where: { id: param },
        include: {
          shows: {
            include: { theatre: true, screen: true },
            orderBy: { startTime: 'asc' }
          }
        }
      });
    } else {
      // Find by slug or matching title
      const cleanTitle = param.replace(/[-_]/g, ' ');
      movie = await prisma.movie.findFirst({
        where: {
          OR: [
            { title: { contains: cleanTitle, mode: 'insensitive' } },
            { id: param }
          ]
        },
        include: {
          shows: {
            include: { theatre: true, screen: true },
            orderBy: { startTime: 'asc' }
          }
        }
      });
    }

    if (!movie) {
      throw new AppError(404, 'Movie not found', 'NOT_FOUND');
    }

    res.json({ success: true, data: movie });
  } catch (err) { next(err); }
});

export default router;
