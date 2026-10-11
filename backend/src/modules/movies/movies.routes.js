import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Search movies
router.get('/search', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const movies = await prisma.movie.findMany({
      where: { title: { contains: q, mode: 'insensitive' } }
    });
    res.json({ success: true, data: movies });
  } catch (err) {
    next(err);
  }
});

// User's Watchlist (Feature 13)
router.get('/watchlist/my', authenticate, async (req, res, next) => {
  try {
    const list = await prisma.watchlist.findMany({
      where: { userId: req.user.id },
      include: { movie: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: list.map((item) => item.movie) });
  } catch (err) {
    next(err);
  }
});

// All movies
router.get('/', async (req, res, next) => {
  try {
    const movies = await prisma.movie.findMany();
    res.json({ success: true, data: movies });
  } catch (err) {
    next(err);
  }
});

// Single movie details
router.get('/:id', async (req, res, next) => {
  try {
    const movie = await prisma.movie.findUnique({
      where: { id: req.params.id },
      include: {
        shows: {
          include: { theatre: true }
        },
        reviews: {
          include: {
            user: {
              select: { id: true, fullName: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    if (!movie) throw new AppError(404, 'Movie not found', 'NOT_FOUND');
    res.json({ success: true, data: movie });
  } catch (err) {
    next(err);
  }
});

// Reviews for a movie (Feature 12)
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { movieId: req.params.id },
      include: {
        user: { select: { id: true, fullName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalReviews = reviews.length;
    const avgScore =
      totalReviews > 0
        ? Number((reviews.reduce((sum, r) => sum + r.ratingScore, 0) / totalReviews).toFixed(1))
        : null;

    res.json({
      success: true,
      data: {
        reviews,
        totalReviews,
        averageRating: avgScore
      }
    });
  } catch (err) {
    next(err);
  }
});

// Post / Edit Review (Feature 12)
router.post('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const { ratingScore, reviewText } = req.body;
    const score = Number(ratingScore);
    if (!score || score < 1 || score > 5) {
      throw new AppError(400, 'Rating score must be between 1 and 5 stars', 'INVALID_RATING');
    }

    const review = await prisma.review.upsert({
      where: {
        userId_movieId: {
          userId: req.user.id,
          movieId: req.params.id
        }
      },
      update: {
        ratingScore: score,
        reviewText: reviewText?.trim() || null
      },
      create: {
        userId: req.user.id,
        movieId: req.params.id,
        ratingScore: score,
        reviewText: reviewText?.trim() || null
      },
      include: {
        user: { select: { id: true, fullName: true } }
      }
    });

    res.json({ success: true, data: review, message: 'Review saved successfully' });
  } catch (err) {
    next(err);
  }
});

// Delete Review (Feature 12)
router.delete('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    await prisma.review.deleteMany({
      where: {
        userId: req.user.id,
        movieId: req.params.id
      }
    });
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// Check Watchlist status (Feature 13)
router.get('/:id/watchlist', authenticate, async (req, res, next) => {
  try {
    const entry = await prisma.watchlist.findUnique({
      where: {
        userId_movieId: {
          userId: req.user.id,
          movieId: req.params.id
        }
      }
    });
    res.json({ success: true, inWatchlist: Boolean(entry) });
  } catch (err) {
    next(err);
  }
});

// Toggle Watchlist (Feature 13)
router.post('/:id/watchlist', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_movieId: {
          userId: req.user.id,
          movieId: req.params.id
        }
      }
    });

    if (existing) {
      await prisma.watchlist.delete({
        where: {
          userId_movieId: {
            userId: req.user.id,
            movieId: req.params.id
          }
        }
      });
      res.json({ success: true, inWatchlist: false, message: 'Removed from watchlist' });
    } else {
      await prisma.watchlist.create({
        data: {
          userId: req.user.id,
          movieId: req.params.id
        }
      });
      res.json({ success: true, inWatchlist: true, message: 'Added to watchlist' });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
