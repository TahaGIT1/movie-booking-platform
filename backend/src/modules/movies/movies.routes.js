import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { tmdbService, formatTmdbMovie } from '../../services/tmdb.service.js';

const router = Router();

// 1. Trending Movies
router.get('/trending', async (req, res, next) => {
  try {
    const timeWindow = req.query.window === 'day' ? 'day' : 'week';
    const page = parseInt(req.query.page, 10) || 1;
    const data = await tmdbService.getTrending(timeWindow, page);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

// 2. Now Playing in Cinemas
router.get('/now-playing', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await tmdbService.getNowPlaying(page);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

// 3. Upcoming Movies (Coming Soon)
router.get('/upcoming', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await tmdbService.getUpcoming(page);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

// 4. Popular Movies
router.get('/popular', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const data = await tmdbService.getPopular(page);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

// 5. Search Movies via TMDB + Local DB
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || req.query.query || '').trim();
    const page = parseInt(req.query.page, 10) || 1;

    if (!q) {
      return res.json({ success: true, movies: [], page: 1, totalResults: 0 });
    }

    const [tmdbResult, dbMovies] = await Promise.all([
      tmdbService.searchMovies(q, page).catch(() => ({ movies: [] })),
      prisma.movie.findMany({
        where: { title: { contains: q, mode: 'insensitive' } },
        include: {
          shows: {
            include: { theatre: true, screen: true },
            orderBy: { startTime: 'asc' },
          },
        },
        take: 5,
      }),
    ]);

    // Format DB matches to match movie item shape
    const formattedDbMovies = dbMovies.map((dbM) => ({
      id: dbM.id,
      dbMovieId: dbM.id,
      title: dbM.title,
      description: dbM.synopsis || '',
      synopsis: dbM.synopsis || '',
      posterImage: dbM.posterUrl || '/images/movies/the-batman.jpg',
      backdropImage: dbM.posterUrl || '/images/backgrounds/batman_hero.jpg',
      rating: 4.8,
      genre: Array.isArray(dbM.genres) ? dbM.genres.join(', ') : 'Action, Drama',
      genreTags: Array.isArray(dbM.genres) && dbM.genres.length > 0 ? dbM.genres : ['Action', 'Drama'],
      genres: Array.isArray(dbM.genres) ? dbM.genres : ['Action', 'Drama'],
      formats: ['IMAX 2D', 'Dolby Atmos'],
      duration: dbM.durationMinutes ? `${Math.floor(dbM.durationMinutes / 60)}h ${dbM.durationMinutes % 60}m` : '2h 15m',
      director: dbM.director || '',
      hasLiveShows: Boolean(dbM.shows && dbM.shows.length > 0),
      shows: dbM.shows || [],
      primaryAction: {
        label: dbM.shows?.length > 0 ? 'Book Seats' : 'More Info',
        icon: 'ticket',
        link: dbM.shows?.length > 0 ? `/book/${dbM.id}` : `/movie/${dbM.id}`,
      },
      secondaryAction: {
        label: 'More Info',
        link: `/movie/${dbM.id}`,
      },
      category: 'movie',
    }));

    // Deduplicate: remove TMDB items that share title with formatted DB movies
    const dbTitles = new Set(formattedDbMovies.map((m) => m.title.toLowerCase().trim()));
    const filteredTmdb = (tmdbResult.movies || []).filter(
      (m) => !dbTitles.has(m.title.toLowerCase().trim())
    );

    const mergedMovies = [...formattedDbMovies, ...filteredTmdb];

    res.json({
      success: true,
      page: tmdbResult.page || 1,
      totalPages: tmdbResult.totalPages || 1,
      totalResults: mergedMovies.length,
      movies: mergedMovies,
      data: mergedMovies,
    });
  } catch (err) {
    next(err);
  }
});

// 6. User's Watchlist
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

// 7. Movie Trailers
router.get('/:id/trailers', async (req, res, next) => {
  try {
    const tmdbId = parseInt(req.params.id, 10);
    if (isNaN(tmdbId)) {
      return res.json({ success: true, trailers: [] });
    }
    const trailers = await tmdbService.getMovieTrailers(tmdbId);
    res.json({ success: true, trailers });
  } catch (err) {
    next(err);
  }
});

// 8. List movies (supports ?status=now_playing, ?status=upcoming, ?status=trending, ?status=popular)
router.get('/', async (req, res, next) => {
  try {
    const { status, search, genre, source, page = 1 } = req.query;

    if (source === 'db') {
      const dbMovies = await prisma.movie.findMany({
        include: {
          shows: {
            include: { theatre: true, screen: true },
            orderBy: { startTime: 'asc' },
          },
        },
        orderBy: { releaseDate: 'desc' },
      });
      return res.json({ success: true, data: dbMovies });
    }

    if (status === 'upcoming') {
      const data = await tmdbService.getUpcoming(parseInt(page, 10) || 1);
      return res.json({ success: true, ...data, data: data.movies });
    }

    if (status === 'trending') {
      const data = await tmdbService.getTrending('week', parseInt(page, 10) || 1);
      return res.json({ success: true, ...data, data: data.movies });
    }

    if (status === 'popular') {
      const data = await tmdbService.getPopular(parseInt(page, 10) || 1);
      return res.json({ success: true, ...data, data: data.movies });
    }

    // Default: Combine DB movies that have live scheduled shows with TMDB Now Playing
    const [nowPlayingData, activeDbMovies] = await Promise.all([
      tmdbService.getNowPlaying(parseInt(page, 10) || 1).catch(() => ({ movies: [] })),
      prisma.movie.findMany({
        where: {
          shows: { some: { isCancelled: false } },
        },
        include: {
          shows: {
            include: { theatre: true, screen: true },
            orderBy: { startTime: 'asc' },
          },
        },
      }).catch(() => []),
    ]);

    // Format active DB movies
    const formattedActiveDb = activeDbMovies.map((dbM, idx) => ({
      id: dbM.id,
      dbMovieId: dbM.id,
      title: dbM.title,
      description: dbM.synopsis || '',
      synopsis: dbM.synopsis || '',
      posterImage: dbM.posterUrl || '/images/movies/the-batman.jpg',
      backdropImage: dbM.posterUrl || '/images/backgrounds/batman_hero.jpg',
      rating: 4.8,
      genre: Array.isArray(dbM.genres) ? dbM.genres.join(', ') : 'Action, Drama',
      genreTags: Array.isArray(dbM.genres) && dbM.genres.length > 0 ? dbM.genres : ['Action', 'Drama'],
      genres: Array.isArray(dbM.genres) ? dbM.genres : ['Action', 'Drama'],
      formats: ['IMAX 2D', 'Dolby Atmos'],
      duration: dbM.durationMinutes ? `${Math.floor(dbM.durationMinutes / 60)}h ${dbM.durationMinutes % 60}m` : '2h 15m',
      director: dbM.director || '',
      hasLiveShows: true,
      shows: dbM.shows,
      statusCategory: 'now',
      primaryAction: {
        label: 'Book Seats',
        icon: 'ticket',
        link: `/book/${dbM.id}`,
      },
      secondaryAction: {
        label: 'More Info',
        link: `/movie/${dbM.id}`,
      },
      category: 'movie',
    }));

    // Put active DB movies with real shows upfront, followed by real TMDB now playing movies
    const activeTitles = new Set(formattedActiveDb.map((m) => m.title.toLowerCase().trim()));
    const tmdbList = (nowPlayingData.movies || []).filter(
      (m) => !activeTitles.has(m.title.toLowerCase().trim())
    );

    const allMovies = [...formattedActiveDb, ...tmdbList].map((m, idx) => ({
      ...m,
      indexNumber: (idx + 1).toString().padStart(2, '0'),
    }));

    res.json({
      success: true,
      data: allMovies,
      movies: allMovies,
      totalResults: allMovies.length,
    });
  } catch (err) {
    next(err);
  }
});

// 9. Get movie by ID (supports TMDB ID, DB UUID, or slug/title)
router.get('/:id', async (req, res, next) => {
  try {
    const param = req.params.id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
    const isTmdbNumeric = /^\d+$/.test(param);

    // Case 1: TMDB Numeric ID
    if (isTmdbNumeric) {
      try {
        const tmdbMovie = await tmdbService.getMovieDetails(parseInt(param, 10));
        if (tmdbMovie) {
          return res.json({ success: true, data: tmdbMovie });
        }
      } catch (err) {
        console.warn(`[TMDB] Movie ID ${param} not found in TMDB:`, err.message);
      }
    }

    // Case 2: Database UUID
    if (isUuid) {
      const dbMovie = await prisma.movie.findUnique({
        where: { id: param },
        include: {
          shows: {
            include: { theatre: true, screen: true },
            orderBy: { startTime: 'asc' },
          },
          reviews: {
            include: {
              user: { select: { id: true, fullName: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        },
      });

      if (dbMovie) {
        const formatted = {
          id: dbMovie.id,
          dbMovieId: dbMovie.id,
          title: dbMovie.title,
          synopsis: dbMovie.synopsis || '',
          description: dbMovie.synopsis || '',
          durationMinutes: dbMovie.durationMinutes,
          duration: `${Math.floor(dbMovie.durationMinutes / 60)}h ${dbMovie.durationMinutes % 60}m`,
          censorCertificate: dbMovie.censorCertificate,
          originalLanguage: dbMovie.originalLanguage,
          genres: dbMovie.genres,
          genreTags: dbMovie.genres,
          genre: Array.isArray(dbMovie.genres) ? dbMovie.genres.join(', ') : '',
          cast: Array.isArray(dbMovie.castMembers)
            ? dbMovie.castMembers.map((c) => (typeof c === 'string' ? c : c.name || c.actor))
            : [],
          director: dbMovie.director || '',
          posterImage: dbMovie.posterUrl || '/images/movies/the-batman.jpg',
          backdropImage: dbMovie.posterUrl || '/images/backgrounds/batman_hero.jpg',
          trailerUrl: dbMovie.trailerUrl || '',
          releaseDate: dbMovie.releaseDate,
          formats: ['IMAX 2D', 'Dolby Atmos'],
          rating: 4.8,
          hasLiveShows: Boolean(dbMovie.shows && dbMovie.shows.length > 0),
          shows: dbMovie.shows || [],
          reviews: dbMovie.reviews || [],
          primaryAction: {
            label: dbMovie.shows?.length > 0 ? 'Book Seats' : 'Book Tickets',
            icon: 'ticket',
            link: `/book/${dbMovie.id}`,
          },
          secondaryAction: {
            label: 'More Info',
            link: `/movie/${dbMovie.id}`,
          },
          category: 'movie',
        };

        return res.json({ success: true, data: formatted });
      }
    }

    // Case 3: Title or slug search fallback
    const cleanTitle = param.replace(/[-_]/g, ' ');
    const dbSearch = await prisma.movie.findFirst({
      where: {
        OR: [
          { title: { contains: cleanTitle, mode: 'insensitive' } },
          { id: param },
        ],
      },
      include: {
        shows: {
          include: { theatre: true, screen: true },
          orderBy: { startTime: 'asc' },
        },
        reviews: {
          include: {
            user: { select: { id: true, fullName: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      },
    });

    if (dbSearch) {
      const formatted = {
        id: dbSearch.id,
        dbMovieId: dbSearch.id,
        title: dbSearch.title,
        synopsis: dbSearch.synopsis || '',
        description: dbSearch.synopsis || '',
        durationMinutes: dbSearch.durationMinutes,
        duration: `${Math.floor(dbSearch.durationMinutes / 60)}h ${dbSearch.durationMinutes % 60}m`,
        genres: dbSearch.genres,
        genreTags: dbSearch.genres,
        genre: Array.isArray(dbSearch.genres) ? dbSearch.genres.join(', ') : '',
        director: dbSearch.director || '',
        posterImage: dbSearch.posterUrl || '/images/movies/the-batman.jpg',
        backdropImage: dbSearch.posterUrl || '/images/backgrounds/batman_hero.jpg',
        trailerUrl: dbSearch.trailerUrl || '',
        releaseDate: dbSearch.releaseDate,
        formats: ['IMAX 2D', 'Dolby Atmos'],
        rating: 4.8,
        hasLiveShows: Boolean(dbSearch.shows && dbSearch.shows.length > 0),
        shows: dbSearch.shows || [],
        reviews: dbSearch.reviews || [],
        primaryAction: {
          label: dbSearch.shows?.length > 0 ? 'Book Seats' : 'Book Tickets',
          icon: 'ticket',
          link: `/book/${dbSearch.id}`,
        },
        category: 'movie',
      };
      return res.json({ success: true, data: formatted });
    }

    // Try TMDB search by title if not found in DB
    const searchResult = await tmdbService.searchMovies(cleanTitle);
    if (searchResult.movies && searchResult.movies.length > 0) {
      const topMatch = searchResult.movies[0];
      const details = await tmdbService.getMovieDetails(topMatch.tmdbId).catch(() => topMatch);
      return res.json({ success: true, data: details });
    }

    throw new AppError(404, 'Movie not found', 'NOT_FOUND');
  } catch (err) {
    next(err);
  }
});

// 10. Reviews for a movie
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

// 11. Post / Edit Review
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

// 12. Delete Review
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

// 13. Check Watchlist status
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

// 14. Toggle Watchlist
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
