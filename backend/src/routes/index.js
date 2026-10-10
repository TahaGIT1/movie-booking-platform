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
import { tmdbService } from '../services/tmdb.service.js';
import { ticketmasterService } from '../services/ticketmaster.service.js';

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

// Categorize database records accurately so events/sports are not listed as movies
function categorizeDbItem(m) {
  const title = m.title || '';
  const genres = Array.isArray(m.genres) ? m.genres : [];
  const isSport = /IPL|Cricket|Trophy|Super League|Football|Soccer|Kabaddi|Match|Sports/i.test(title) ||
    genres.some((g) => /Sports|Cricket|IPL|Football/i.test(g));
  if (isSport) return 'sport';

  const isPlay = /Latent|Samay|Bassi|Comedy|RAM|Theatre|Play|Zakir|Circus|House/i.test(title) ||
    genres.some((g) => /Comedy|Latent|Standup|Theatre/i.test(g));
  if (isPlay) return 'play';

  const isActivity = /Park|Museum|Planetarium|Jaigarh|Safari|Snow|Statue|Gate|Light and Sound/i.test(title);
  if (isActivity) return 'activity';

  const isEvent = /Sunburn|Diljit|Concert|Festival|Tour|Roses|Fighters|Keinemusik|AEDEN/i.test(title);
  if (isEvent) return 'event';

  return 'movie';
}

function formatSearchItem(m, category) {
  let city = 'India';
  if (/Bengaluru|Bangalore/i.test(m.title)) city = 'Bengaluru';
  else if (/Mumbai/i.test(m.title)) city = 'Mumbai';
  else if (/Delhi/i.test(m.title)) city = 'Delhi';
  else if (/Kolkata/i.test(m.title)) city = 'Kolkata';
  else if (/Hyderabad/i.test(m.title)) city = 'Hyderabad';
  else if (/Jaipur/i.test(m.title)) city = 'Jaipur';

  const rawGenres = Array.isArray(m.genres) && m.genres.length > 0 ? m.genres : [category.toUpperCase()];
  return {
    id: m.id,
    title: m.title,
    description: m.synopsis || '',
    synopsis: m.synopsis || '',
    posterImage: m.posterUrl || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80',
    category,
    city,
    venue: `${city}, India`,
    genre: rawGenres.join(', '),
    rating: 4.8,
    ticketUrl: `/book/${m.id}`,
    primaryAction: {
      label: category === 'sport' ? 'Book Tickets' : 'Book Passes',
      icon: 'ticket',
      link: `/book/${m.id}`,
    },
    secondaryAction: {
      label: 'More Info',
      link: `/${category === 'sport' ? 'sports' : category === 'play' ? 'plays' : category === 'activity' ? 'activities' : 'events'}/${m.id}`,
    },
  };
}

// Global unified search with category context support (sports, plays, events, movies, theatres)
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const category = (req.query.category || req.query.type || 'all').trim().toLowerCase();

    if (!q) {
      return res.json({
        success: true,
        category,
        movies: [],
        theatres: [],
        events: [],
        sports: [],
        plays: [],
        activities: [],
      });
    }

    const [tmdbResult, tmEvents, tmSports, tmPlays, dbMatches, theatres] = await Promise.all([
      tmdbService.searchMovies(q, 1).catch(() => ({ movies: [] })),
      ticketmasterService.getEvents({ keyword: q, size: 6 }).catch(() => ({ events: [] })),
      ticketmasterService.getSports({ keyword: q, size: 6 }).catch(() => ({ events: [] })),
      ticketmasterService.getPlays({ keyword: q, size: 6 }).catch(() => ({ events: [] })),
      prisma.movie.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { synopsis: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 12,
      }),
      prisma.theatre.findMany({
        where: { name: { contains: q, mode: 'insensitive' }, status: { in: ['ACTIVE', 'APPROVED'] } },
        take: 5,
      }),
    ]);

    // Segregate DB matches into proper buckets
    const dbMovies = [];
    const dbSports = [];
    const dbPlays = [];
    const dbActivities = [];
    const dbEvents = [];

    dbMatches.forEach((m) => {
      const type = categorizeDbItem(m);
      if (type === 'sport') dbSports.push(formatSearchItem(m, 'sport'));
      else if (type === 'play') dbPlays.push(formatSearchItem(m, 'play'));
      else if (type === 'activity') dbActivities.push(formatSearchItem(m, 'activity'));
      else if (type === 'event') dbEvents.push(formatSearchItem(m, 'event'));
      else {
        dbMovies.push({
          id: m.id,
          title: m.title,
          posterImage: m.posterUrl || '/images/movies/the-batman.jpg',
          genre: Array.isArray(m.genres) ? m.genres.join(', ') : '',
          rating: 4.8,
        });
      }
    });

    const dbTitles = new Set(dbMovies.map((m) => m.title.toLowerCase().trim()));
    const tmdbFormatted = (tmdbResult.movies || [])
      .filter((m) => !dbTitles.has(m.title.toLowerCase().trim()))
      .slice(0, 8);

    // Filter out irrelevant venue matches from Ticketmaster when searching for sports
    const cleanTmSports = (tmSports.events || []).filter(
      (e) => !/candy|crafting/i.test(e.title || '')
    );

    const mergedSports = [...dbSports, ...cleanTmSports];
    const mergedPlays = [...dbPlays, ...(tmPlays.events || [])];
    const mergedEvents = [...dbEvents, ...(tmEvents.events || [])];

    res.json({
      success: true,
      category,
      movies: [...dbMovies, ...tmdbFormatted],
      theatres,
      sports: mergedSports,
      plays: mergedPlays,
      events: mergedEvents,
      activities: dbActivities,
    });
  } catch (err) {
    next(err);
  }
});



router.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export default router;
