import { Router } from 'express';
import { prisma } from '../../config/prisma.js';

const router = Router();

// Helper to format DB movie/item for public discovery
function formatCatalogItem(item) {
  if (!item) return null;
  return {
    id: item.id,
    title: item.title,
    description: item.synopsis || '',
    posterImage: item.posterUrl || '',
    backdropImage: item.posterUrl || '',
    genre: Array.isArray(item.genres) ? item.genres.join(', ') : '',
    genreTags: Array.isArray(item.genres) ? item.genres : [],
    duration: item.durationMinutes ? `${Math.floor(item.durationMinutes / 60)}h ${item.durationMinutes % 60}m` : '',
    formats: ['Standard', 'Digital'],
    rating: 4.5,
    scheduleStatus: 'Upcoming',
    primaryAction: {
      label: 'Book Now',
      icon: 'ticket',
      link: `/book/${item.id}`,
    },
    secondaryAction: {
      label: 'More Info',
      link: `/movie/${item.id}`,
    },
    priceRM: 250,
  };
}

// Events (Music concerts, festivals, live tours from DB)
router.get('/events', async (req, res, next) => {
  try {
    const items = await prisma.movie.findMany({
      where: {
        OR: [
          { title: { contains: 'Tour', mode: 'insensitive' } },
          { title: { contains: 'Festival', mode: 'insensitive' } },
          { title: { contains: 'Concert', mode: 'insensitive' } },
          { title: { contains: 'Sunburn', mode: 'insensitive' } },
          { title: { contains: 'Diljit', mode: 'insensitive' } },
          { title: { contains: 'Keinemusik', mode: 'insensitive' } },
          { title: { contains: 'Roses', mode: 'insensitive' } },
          { title: { contains: 'Fighters', mode: 'insensitive' } },
          { title: { contains: 'Circus', mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items.map(formatCatalogItem));
  } catch (err) {
    next(err);
  }
});

router.get('/events/:id', async (req, res, next) => {
  try {
    const item = await prisma.movie.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Event not found in database' });
    res.json(formatCatalogItem(item));
  } catch (err) {
    next(err);
  }
});

// Streams (Digital releases in DB)
router.get('/streams', async (req, res, next) => {
  try {
    const items = await prisma.movie.findMany({
      where: {
        trailerUrl: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items.map(formatCatalogItem));
  } catch (err) {
    next(err);
  }
});

router.get('/streams/:id', async (req, res, next) => {
  try {
    const item = await prisma.movie.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Stream not found in database' });
    res.json(formatCatalogItem(item));
  } catch (err) {
    next(err);
  }
});

// Plays (Comedy, theatre shows in DB)
router.get('/plays', async (req, res, next) => {
  try {
    const items = await prisma.movie.findMany({
      where: {
        OR: [
          { title: { contains: 'Comedy', mode: 'insensitive' } },
          { title: { contains: 'RAM', mode: 'insensitive' } },
          { title: { contains: 'House', mode: 'insensitive' } },
          { title: { contains: 'Bassi', mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items.map(formatCatalogItem));
  } catch (err) {
    next(err);
  }
});

router.get('/plays/:id', async (req, res, next) => {
  try {
    const item = await prisma.movie.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Play not found in database' });
    res.json(formatCatalogItem(item));
  } catch (err) {
    next(err);
  }
});

// Sports (from DB)
router.get('/sports', async (req, res, next) => {
  try {
    const items = await prisma.movie.findMany({
      where: {
        OR: [
          { title: { contains: 'Sport', mode: 'insensitive' } },
          { title: { contains: 'Marathon', mode: 'insensitive' } },
          { title: { contains: 'Tournament', mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items.map(formatCatalogItem));
  } catch (err) {
    next(err);
  }
});

router.get('/sports/:id', async (req, res, next) => {
  try {
    const item = await prisma.movie.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Sport item not found in database' });
    res.json(formatCatalogItem(item));
  } catch (err) {
    next(err);
  }
});

// Activities (Parks, museums, attractions in DB)
router.get('/activities', async (req, res, next) => {
  try {
    const items = await prisma.movie.findMany({
      where: {
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
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items.map(formatCatalogItem));
  } catch (err) {
    next(err);
  }
});

router.get('/activities/:id', async (req, res, next) => {
  try {
    const item = await prisma.movie.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Activity not found in database' });
    res.json(formatCatalogItem(item));
  } catch (err) {
    next(err);
  }
});

// Offers (Active coupons from DB)
router.get('/offers', async (req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: {
        validUntil: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(coupons);
  } catch (err) {
    next(err);
  }
});

export default router;
