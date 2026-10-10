import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { createMovieSchema } from '../movies/movies.schema.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const router = Router();

router.use(authenticate, requirePermission(['CREATE_MOVIE', 'MANAGE_MOVIES']));

function sanitizeMoviePayload(body) {
  const data = { ...body };

  // Parse releaseDate safely
  if (data.releaseDate && typeof data.releaseDate === 'string' && data.releaseDate.trim() !== '') {
    const parsed = new Date(data.releaseDate);
    data.releaseDate = isNaN(parsed.getTime()) ? null : parsed;
  } else if (!data.releaseDate) {
    data.releaseDate = null;
  }

  // Ensure durationMinutes is integer
  if (data.durationMinutes !== undefined && data.durationMinutes !== null) {
    data.durationMinutes = parseInt(data.durationMinutes, 10);
  }

  // Nullify empty strings
  if (data.posterUrl === '') data.posterUrl = null;
  if (data.trailerUrl === '') data.trailerUrl = null;
  if (data.synopsis === '') data.synopsis = null;
  if (data.director === '') data.director = null;

  // Ensure genres is an array
  if (typeof data.genres === 'string') {
    data.genres = data.genres.split(',').map((g) => g.trim()).filter(Boolean);
  } else if (!Array.isArray(data.genres)) {
    data.genres = [];
  }

  // Ensure supportedLanguages is an array
  if (typeof data.supportedLanguages === 'string') {
    data.supportedLanguages = data.supportedLanguages.split(',').map((l) => l.trim()).filter(Boolean);
  } else if (!Array.isArray(data.supportedLanguages)) {
    data.supportedLanguages = [];
  }

  // Ensure castMembers is JSON array
  if (typeof data.castMembers === 'string') {
    try {
      data.castMembers = JSON.parse(data.castMembers);
    } catch {
      data.castMembers = data.castMembers
        .split(',')
        .map((item) => {
          const trimmed = item.trim();
          if (!trimmed) return null;
          const parts = trimmed.split(/\s+as\s+/i);
          return parts.length > 1
            ? { name: parts[0].trim(), role: parts[1].trim() }
            : { name: trimmed };
        })
        .filter(Boolean);
    }
  } else if (Array.isArray(data.castMembers)) {
    data.castMembers = data.castMembers.map((item) =>
      typeof item === 'string' ? { name: item.trim() } : item
    );
  } else if (!data.castMembers) {
    data.castMembers = [];
  }

  return data;
}

// Create new movie
router.post('/', validateRequest(createMovieSchema), async (req, res, next) => {
  try {
    const data = sanitizeMoviePayload(req.body);
    const movie = await prisma.movie.create({ data });
    res.status(201).json({ success: true, data: movie, message: 'Movie created successfully' });
  } catch (err) {
    next(err);
  }
});

// List all movies
router.get('/', async (req, res, next) => {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { shows: true, reviews: true }
        }
      }
    });
    res.json({ success: true, data: movies });
  } catch (err) {
    next(err);
  }
});

// Get movie by ID
router.get('/:id', async (req, res, next) => {
  try {
    const movie = await prisma.movie.findUnique({
      where: { id: req.params.id },
      include: {
        shows: {
          include: { screen: true, theatre: true }
        }
      }
    });
    if (!movie) throw new AppError(404, 'Movie not found', 'NOT_FOUND');
    res.json({ success: true, data: movie });
  } catch (err) {
    next(err);
  }
});

// Update movie
router.put('/:id', validateRequest(createMovieSchema.partial()), async (req, res, next) => {
  try {
    const data = sanitizeMoviePayload(req.body);
    const movie = await prisma.movie.update({
      where: { id: req.params.id },
      data
    });
    res.json({ success: true, data: movie, message: 'Movie updated successfully' });
  } catch (err) {
    next(err);
  }
});

// Delete movie
router.delete('/:id', async (req, res, next) => {
  try {
    const movieId = req.params.id;
    // Remove any related shows and statuses first to prevent foreign key errors
    await prisma.showSeatStatus.deleteMany({
      where: { show: { movieId } }
    });
    await prisma.bookingSeat.deleteMany({
      where: { booking: { show: { movieId } } }
    });
    await prisma.booking.deleteMany({
      where: { show: { movieId } }
    });
    await prisma.show.deleteMany({
      where: { movieId }
    });
    await prisma.movie.delete({
      where: { id: movieId }
    });
    res.json({ success: true, message: 'Movie deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;