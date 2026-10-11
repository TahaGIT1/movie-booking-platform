import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { ticketmasterService } from '../../services/ticketmaster.service.js';
import { INDIAN_LIVE_EVENTS } from '../../data/indianEvents.data.js';
import { getRealTimeIndianEvents } from '../../services/district.service.js';

const router = Router();

const IMDB_RATINGS = {
  'obsession': '7.6',
  'pinocchio: unstrung': '7.2',
  'digger': '7.8',
  'matchbox the movie': '8.2',
  'coyote vs. acme': '8.5',
  'resident dead': '7.5',
  'after impact': '7.7',
  'fall 2: deadpoint': '8.0',
  'runner': '8.3',
  'the fix': '7.9',
  'the odyssey': '8.7',
  'resident evil': '7.8',
  'drishyam the conclusion': '8.6',
  'premada oorali': '8.4',
  'bail': '8.1',
  'house of the dragon': '8.4',
  'the last of us': '8.8',
  'the mandalorian': '8.6',
  'stranger things': '8.7',
};

const STREAM_TRAILERS = {
  'fall 2: deadpoint': 'https://www.youtube.com/watch?v=cW798YSw0Og',
  'fall 2': 'https://www.youtube.com/watch?v=cW798YSw0Og',
  'fall': 'https://www.youtube.com/watch?v=cW798YSw0Og',
  'obsession': 'https://www.youtube.com/watch?v=ZKGQuhlhppA',
  'pinocchio: unstrung': 'https://www.youtube.com/watch?v=D3lopXcoY8g',
  'pinocchio': 'https://www.youtube.com/watch?v=D3lopXcoY8g',
  'digger': 'https://www.youtube.com/watch?v=_Z5-kz1JUhw',
  'matchbox the movie': 'https://www.youtube.com/watch?v=7xfqITrMDcI',
  'matchbox': 'https://www.youtube.com/watch?v=7xfqITrMDcI',
  'coyote vs. acme': 'https://www.youtube.com/watch?v=H-43VeYGiPM',
  'coyote': 'https://www.youtube.com/watch?v=H-43VeYGiPM',
  'runner': 'https://www.youtube.com/watch?v=zz4rsZLcauY',
  'the runner': 'https://www.youtube.com/watch?v=zz4rsZLcauY',
  'the fix': 'https://www.youtube.com/watch?v=C0e_Shx11KQ',
  'resident evil': 'https://www.youtube.com/watch?v=4q6UGCyHZCI',
  'drishyam the conclusion': 'https://www.youtube.com/watch?v=cxA2y9Tgl7o',
  'drishyam': 'https://www.youtube.com/watch?v=cxA2y9Tgl7o',
  'the odyssey': 'https://www.youtube.com/watch?v=Way9Dexny3w',
  'resident dead': 'https://www.youtube.com/watch?v=k10ETZ41q5o',
  'after impact': 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
  'bail': 'https://www.youtube.com/watch?v=qEVUtrk8_B4',
  'premada oorali': 'https://www.youtube.com/watch?v=c25GKl5VNeY',
  'house of the dragon': 'https://www.youtube.com/watch?v=DotnJ7tTA34',
  'the last of us': 'https://www.youtube.com/watch?v=uLtkt8BonwM',
  'the mandalorian': 'https://www.youtube.com/watch?v=eW7Twd85m2g',
  'stranger things': 'https://www.youtube.com/watch?v=b9EkMc79ZSU',
};

function getStreamTrailer(title, currentTrailer) {
  if (title) {
    const clean = title.toLowerCase().trim();
    if (STREAM_TRAILERS[clean]) return STREAM_TRAILERS[clean];
    for (const [k, v] of Object.entries(STREAM_TRAILERS)) {
      if (clean.includes(k) || k.includes(clean)) return v;
    }
  }
  return currentTrailer || 'https://www.youtube.com/watch?v=vxNXt20j16w';
}

function getImdbRating(title) {
  if (!title) return '7.8';
  const clean = title.toLowerCase().trim();
  if (IMDB_RATINGS[clean]) return IMDB_RATINGS[clean];
  for (const [key, val] of Object.entries(IMDB_RATINGS)) {
    if (clean.includes(key) || key.includes(clean)) return val;
  }
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const score = 7.2 + (Math.abs(hash) % 17) * 0.1;
  return score.toFixed(1);
}

// Helper to format DB item for public discovery
function formatCatalogItem(item, defaultCategory = 'event') {
  if (!item) return null;
  if (item.source === 'ticketmaster') return item;

  // Extract city from title if present
  let city = 'India';
  const parts = item.title.split(',');
  if (parts.length > 1) {
    city = parts[parts.length - 1].trim();
  } else if (/Bengaluru|Bangalore/i.test(item.title)) {
    city = 'Bengaluru';
  } else if (/Mumbai/i.test(item.title)) {
    city = 'Mumbai';
  } else if (/Delhi/i.test(item.title)) {
    city = 'Delhi';
  } else if (/Kolkata/i.test(item.title)) {
    city = 'Kolkata';
  } else if (/Hyderabad/i.test(item.title)) {
    city = 'Hyderabad';
  } else if (/Mysore/i.test(item.title)) {
    city = 'Mysore';
  } else if (/Jaipur/i.test(item.title)) {
    city = 'Jaipur';
  } else if (/Guwahati/i.test(item.title)) {
    city = 'Guwahati';
  } else if (/Indore/i.test(item.title)) {
    city = 'Indore';
  } else if (/Chandigarh/i.test(item.title)) {
    city = 'Chandigarh';
  } else if (/Ahmedabad/i.test(item.title)) {
    city = 'Ahmedabad';
  }

  const rawGenres = Array.isArray(item.genres) && item.genres.length > 0 ? item.genres : ['Live Entertainment'];

  return {
    id: item.id,
    title: item.title,
    description: item.synopsis || '',
    synopsis: item.synopsis || '',
    posterImage: item.posterUrl || '',
    backdropImage: item.posterUrl || '',
    trailerUrl: getStreamTrailer(item.title, item.trailerUrl),
    imdbRating: getImdbRating(item.title),
    genre: rawGenres.join(', ').toLowerCase(),
    genreTags: rawGenres,
    duration: item.durationMinutes ? `${Math.floor(item.durationMinutes / 60)}h ${item.durationMinutes % 60}m` : '3h 00m',
    formats: ['LIVE PASS', city.toUpperCase()],
    rating: 4.8,
    scheduleStatus: 'Tickets On Sale',
    scheduleLabel: `${city}, India`,
    city,
    venue: `${city}, India`,
    category: defaultCategory,
    source: 'database',
    primaryAction: {
      label: 'Book Passes',
      icon: 'ticket',
      link: `/book/${item.id}`,
    },
    secondaryAction: {
      label: 'More Info',
      link: `/${defaultCategory === 'play' ? 'plays' : defaultCategory === 'activity' ? 'activities' : defaultCategory === 'sport' ? 'sports' : 'events'}/${item.id}`,
    },
    priceRM: 250,
  };
}

// 1. Events (Shows, Stand-up Comedy, Concerts, Festivals in India - District by Zomato style)
router.get('/events', async (req, res, next) => {
  try {
    const { search, city, category, page = 1, size = 20 } = req.query;

    const allEvents = await getRealTimeIndianEvents();
    let filtered = [...allEvents];

    // Filter by Indian city
    if (city && city.toLowerCase() !== 'all' && city.toLowerCase() !== 'all events') {
      const targetCity = city.toLowerCase().trim();
      filtered = filtered.filter((ev) => {
        if (ev.cities && ev.cities.some((c) => c.toLowerCase().includes(targetCity) || targetCity.includes(c.toLowerCase()))) {
          return true;
        }
        return ev.city.toLowerCase().includes(targetCity) || targetCity.includes(ev.city.toLowerCase());
      });
    }

    // Filter by category
    if (category && category.toLowerCase() !== 'all') {
      const cat = category.toLowerCase().trim();
      filtered = filtered.filter((ev) => {
        if (cat.includes('comedy') || cat.includes('laugh')) return ev.category === 'comedy';
        if (cat.includes('music') || cat.includes('concert')) return ev.category === 'music';
        if (cat.includes('theatre') || cat.includes('art')) return ev.category === 'theatre';
        if (cat.includes('festival')) return ev.category === 'festivals';
        return ev.category === cat;
      });
    }

    // Search query
    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter((ev) =>
        ev.title.toLowerCase().includes(q) ||
        ev.venue.toLowerCase().includes(q) ||
        ev.city.toLowerCase().includes(q)
      );
    }

    const mapped = filtered.map((e, idx) => ({
      ...e,
      indexNumber: String(idx + 1).padStart(2, '0'),
      primaryAction: {
        label: 'Get Tickets',
        icon: 'ticket',
        external: true,
        link: e.ticketUrl,
      },
      secondaryAction: {
        label: 'More Info',
        link: e.ticketUrl,
        external: true,
      },
    }));

    return res.json(mapped);
  } catch (err) {
    next(err);
  }
});

router.get('/events/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Ticketmaster ID
    if (id.startsWith('tm-')) {
      const tmEvent = await ticketmasterService.getEventById(id);
      if (tmEvent) return res.json(tmEvent);
    }

    // Database ID
    const item = await prisma.movie.findUnique({ where: { id } });
    if (!item) {
      // Fallback search in Ticketmaster
      const tmEvent = await ticketmasterService.getEventById(`tm-${id}`).catch(() => null);
      if (tmEvent) return res.json(tmEvent);
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json(formatCatalogItem(item, 'event'));
  } catch (err) {
    next(err);
  }
});

// 2. Plays & Theatre (Stage Plays, Musicals, Comedy Specials)
router.get('/plays', async (req, res, next) => {
  try {
    const { search, city, page = 1 } = req.query;
    const isIndianCity = city && !/global|all|united|london|york|singapore/i.test(city);

    const where = {
      OR: [
        { title: { contains: 'Comedy', mode: 'insensitive' } },
        { title: { contains: 'RAM', mode: 'insensitive' } },
        { title: { contains: 'House', mode: 'insensitive' } },
        { title: { contains: 'Bassi', mode: 'insensitive' } },
        { title: { contains: 'Play', mode: 'insensitive' } },
        { title: { contains: 'Theatre', mode: 'insensitive' } },
        { title: { contains: 'Latent', mode: 'insensitive' } },
        { title: { contains: 'Samay', mode: 'insensitive' } },
        { title: { contains: 'Zakir', mode: 'insensitive' } },
        { genres: { hasSome: ['Comedy', 'Latent Show', 'Standup', 'Theatre'] } },
      ],
    };

    if (search) {
      where.OR.push(
        { title: { contains: search, mode: 'insensitive' } },
        { synopsis: { contains: search, mode: 'insensitive' } }
      );
    }
    if (city && isIndianCity) {
      where.title = { contains: city.trim(), mode: 'insensitive' };
    }

    const [dbItems, tmTheatre] = await Promise.all([
      prisma.movie.findMany({ where, orderBy: { createdAt: 'desc' } }).catch(() => []),
      ticketmasterService
        .getPlays({
          keyword: search || undefined,
          city: !isIndianCity ? city : undefined,
          countryCode: isIndianCity ? 'IN' : undefined,
          page: Math.max(0, parseInt(page, 10) - 1),
          size: 10,
        })
        .catch(() => ({ events: [] })),
    ]);

    const formattedDb = dbItems.map((item) => formatCatalogItem(item, 'play'));

    let merged = [];
    if (isIndianCity) {
      merged = formattedDb;
    } else {
      merged = [...formattedDb, ...(tmTheatre.events || [])];
    }

    res.json(merged.map((p, idx) => ({ ...p, indexNumber: String(idx + 1).padStart(2, '0') })));
  } catch (err) {
    next(err);
  }
});

router.get('/plays/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id.startsWith('tm-')) {
      const tmEvent = await ticketmasterService.getEventById(id);
      if (tmEvent) return res.json(tmEvent);
    }
    const item = await prisma.movie.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: 'Play not found' });
    res.json(formatCatalogItem(item, 'play'));
  } catch (err) {
    next(err);
  }
});

// 3. Sports (Live Tournaments, Match Screenings, Racing, Leagues, IPL, Cricket)
router.get('/sports', async (req, res, next) => {
  try {
    const { search, city, page = 1 } = req.query;
    const isIndianCity = city && !/global|all|united|london|york|singapore/i.test(city);

    const where = {
      OR: [
        { title: { contains: 'IPL', mode: 'insensitive' } },
        { title: { contains: 'Cricket', mode: 'insensitive' } },
        { title: { contains: 'Super League', mode: 'insensitive' } },
        { title: { contains: 'League', mode: 'insensitive' } },
        { title: { contains: 'Trophy', mode: 'insensitive' } },
        { title: { contains: 'Match', mode: 'insensitive' } },
        { title: { contains: 'Sports', mode: 'insensitive' } },
        { title: { contains: 'Football', mode: 'insensitive' } },
        { title: { contains: 'Kabaddi', mode: 'insensitive' } },
        { genres: { hasSome: ['Sports', 'Cricket', 'IPL', 'Football'] } },
      ],
    };

    if (search) {
      where.OR.push(
        { title: { contains: search, mode: 'insensitive' } },
        { synopsis: { contains: search, mode: 'insensitive' } }
      );
    }
    if (city && isIndianCity) {
      where.title = { contains: city.trim(), mode: 'insensitive' };
    }

    const [dbSports, tmSports] = await Promise.all([
      prisma.movie.findMany({ where, orderBy: { createdAt: 'desc' } }).catch(() => []),
      ticketmasterService
        .getSports({
          keyword: search || undefined,
          city: city && !/global|all|india/i.test(city) ? city : undefined,
          page: Math.max(0, parseInt(page, 10) - 1),
          size: 16,
        })
        .catch(() => ({ events: [] })),
    ]);

    const formattedDb = dbSports.map((item) => formatCatalogItem(item, 'sport'));

    let merged = [];
    if (isIndianCity) {
      merged = formattedDb;
    } else {
      merged = [...formattedDb, ...(tmSports.events || [])];
    }

    res.json(merged.map((s, idx) => ({ ...s, indexNumber: String(idx + 1).padStart(2, '0') })));
  } catch (err) {
    next(err);
  }
});

router.get('/sports/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id.startsWith('tm-')) {
      const tmEvent = await ticketmasterService.getEventById(id);
      if (tmEvent) return res.json(tmEvent);
    }
    const item = await prisma.movie.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: 'Sport event not found' });
    res.json(formatCatalogItem(item, 'sport'));
  } catch (err) {
    next(err);
  }
});

// 4. Activities (Experiential Attractions, Amusement Parks, Museums)
router.get('/activities', async (req, res, next) => {
  try {
    const { search, city } = req.query;

    const where = {
      OR: [
        { title: { contains: 'Amusement', mode: 'insensitive' } },
        { title: { contains: 'Park', mode: 'insensitive' } },
        { title: { contains: 'Museum', mode: 'insensitive' } },
        { title: { contains: 'Snow', mode: 'insensitive' } },
        { title: { contains: 'Safari', mode: 'insensitive' } },
        { title: { contains: 'Planetarium', mode: 'insensitive' } },
        { title: { contains: 'Jaigarh', mode: 'insensitive' } },
        { title: { contains: 'Statue', mode: 'insensitive' } },
        { title: { contains: 'Gate', mode: 'insensitive' } },
        { title: { contains: 'Light and Sound', mode: 'insensitive' } },
      ],
    };

    if (search) {
      where.OR.push({ title: { contains: search, mode: 'insensitive' } });
    }
    if (city && !/global|all/i.test(city)) {
      where.title = { contains: city.trim(), mode: 'insensitive' };
    }

    const items = await prisma.movie.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(items.map((item, idx) => ({
      ...formatCatalogItem(item, 'activity'),
      indexNumber: String(idx + 1).padStart(2, '0'),
    })));
  } catch (err) {
    next(err);
  }
});

router.get('/activities/:id', async (req, res, next) => {
  try {
    const item = await prisma.movie.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.json(formatCatalogItem(item, 'activity'));
  } catch (err) {
    next(err);
  }
});

// 5. Streams (Digital Premieres strictly kept separate from movies and events)
router.get('/streams', async (req, res, next) => {
  try {
    const items = await prisma.movie.findMany({
      where: {
        trailerUrl: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items.map((item, idx) => ({
      ...formatCatalogItem(item, 'stream'),
      indexNumber: String(idx + 1).padStart(2, '0'),
      category: 'stream',
      trailerUrl: getStreamTrailer(item.title, item.trailerUrl),
      imdbRating: getImdbRating(item.title),
      primaryAction: {
        label: 'Watch Trailer',
        icon: 'play',
        link: getStreamTrailer(item.title, item.trailerUrl) || `/movie/${item.id}`,
      },
    })));
  } catch (err) {
    next(err);
  }
});

router.get('/streams/:id', async (req, res, next) => {
  try {
    const item = await prisma.movie.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Stream not found' });
    res.json(formatCatalogItem(item, 'stream'));
  } catch (err) {
    next(err);
  }
});

// 6. Offers
router.get('/offers', async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { validUntil: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(coupons);
  } catch (err) {
    next(err);
  }
});

export default router;
