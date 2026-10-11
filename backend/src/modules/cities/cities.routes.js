import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { AUTHORITATIVE_CITIES } from './cities.data.js';

const router = Router();

// Helper to get all cities merged with any DB theatre cities
async function getAllCities() {
  const citiesMap = new Map();
  // Start with authoritative catalogue
  AUTHORITATIVE_CITIES.forEach((c) => {
    citiesMap.set(c.id, { ...c });
  });

  // Query database for any registered theatres with custom cities
  try {
    const dbTheatres = await prisma.theatre.findMany({
      where: { status: { in: ['APPROVED', 'ACTIVE'] } },
      select: { city: true, state: true },
      distinct: ['city'],
    });

    dbTheatres.forEach((t) => {
      if (!t.city) return;
      const normalizedId = t.city.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      if (!citiesMap.has(normalizedId)) {
        citiesMap.set(normalizedId, {
          id: normalizedId,
          name: t.city,
          state: t.state || '',
          country: 'Malaysia',
          countryCode: 'MY',
          isPopular: false,
        });
      }
    });
  } catch {
    // If DB is offline or table empty, fallback gracefully to authoritative catalogue
  }

  return Array.from(citiesMap.values());
}

// GET /api/cities or /api/v1/cities
router.get('/', async (req, res, next) => {
  try {
    const { search, popular } = req.query;
    const allCities = await getAllCities();

    let filtered = allCities;

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = allCities.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          c.id.includes(q)
      );
    } else if (popular === 'true' || popular === '1') {
      filtered = allCities.filter((c) => c.isPopular);
    }

    const popularList = allCities.filter((c) => c.isPopular);

    res.json({
      success: true,
      total: filtered.length,
      data: filtered,
      popular: popularList,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/cities/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const allCities = await getAllCities();
    const city = allCities.find(
      (c) => c.id.toLowerCase() === id.toLowerCase() || c.name.toLowerCase() === id.toLowerCase()
    );

    if (!city) {
      return res.status(404).json({
        success: false,
        message: `City with id "${id}" not found`,
      });
    }

    res.json({
      success: true,
      data: city,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
