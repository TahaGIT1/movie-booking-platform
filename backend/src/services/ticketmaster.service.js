import https from 'https';
import dns from 'dns';

const TM_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

// Cloudflare & Google DNS resolver to bypass ISP regional blocks
const dnsResolver = new dns.Resolver();
dnsResolver.setServers(['1.1.1.1', '8.8.8.8', '1.0.0.1']);

function customLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dnsResolver.resolve4(hostname, (err, addresses) => {
    if (err || !addresses?.length) {
      return dns.lookup(hostname, options, callback);
    }
    if (options && options.all) {
      callback(null, addresses.map((a) => ({ address: a, family: 4 })));
    } else {
      callback(null, addresses[0], 4);
    }
  });
}

function httpsGetJson(urlStr) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      urlStr,
      {
        lookup: customLookup,
        headers: {
          'User-Agent': 'CineVerse-Platform/1.0',
          'Accept': 'application/json',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`Ticketmaster HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse Ticketmaster JSON: ${e.message}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy(new Error('Ticketmaster request timed out'));
    });
  });
}

// In-memory cache with TTL
const cache = new Map();

function getFromCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setToCache(key, data, ttlMs = 20 * 60 * 1000) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Low-level Ticketmaster API call
 */
async function fetchTicketmaster(endpoint, params = {}, options = {}) {
  const apiKey = process.env.TICKETMASTER_API_KEY || '8vTkFt5TsBSzGIaww6RL2YrM0a5NcYCU';

  const url = new URL(`${TM_BASE_URL}${endpoint}`);
  url.searchParams.set('apikey', apiKey);

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  }

  const cacheKey = url.toString();
  const cached = getFromCache(cacheKey);
  if (cached && !options.noCache) {
    return cached;
  }

  let lastError = null;
  const maxRetries = 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await httpsGetJson(url.toString());
      setToCache(cacheKey, data, options.ttlMs || 20 * 60 * 1000);
      return data;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }

  console.warn(`[Ticketmaster] Error fetching ${endpoint}:`, lastError?.message);
  throw lastError;
}

/**
 * Format Ticketmaster Event into unified CineVerse catalog shape
 */
export function formatTmEvent(event, index = 0, defaultCategory = 'event') {
  if (!event) return null;

  const id = `tm-${event.id}`;
  const title = event.name || 'Live Event';

  // Venue & Location
  const venueObj = event._embedded?.venues?.[0] || {};
  const venueName = venueObj.name || 'Stadium / Arena';
  const cityName = venueObj.city?.name || '';
  const stateName = venueObj.state?.name || venueObj.state?.stateCode || '';
  const countryName = venueObj.country?.name || '';
  const locationLabel = [venueName, cityName, countryName].filter(Boolean).join(', ');

  // Images selection (pick 16:9 high-res for backdrop, 3:2 or best aspect for poster)
  const images = Array.isArray(event.images) ? event.images : [];
  const sortedByWidth = [...images].sort((a, b) => (b.width || 0) - (a.width || 0));
  const backdropImage = sortedByWidth[0]?.url || '/images/events/events_hero.jpg';

  const posterCandidate =
    images.find((img) => img.ratio === '3_2' || img.ratio === '4_3') ||
    sortedByWidth[Math.min(1, sortedByWidth.length - 1)] ||
    sortedByWidth[0];
  const posterImage = posterCandidate?.url || backdropImage;

  // Classifications & Genre
  const classification = event.classifications?.[0] || {};
  const segmentName = classification.segment?.name || 'Entertainment';
  const genreName = classification.genre?.name || '';
  const subGenreName = classification.subGenre?.name || '';
  const genreTags = [segmentName, genreName, subGenreName].filter((g) => g && g !== 'Undefined');
  const genreStr = genreTags.join(', ').toLowerCase() || 'live entertainment';

  // Category determination
  let category = defaultCategory;
  const segLower = segmentName.toLowerCase();
  if (segLower.includes('sport')) category = 'sport';
  else if (segLower.includes('theatre') || segLower.includes('arts') || genreName.toLowerCase().includes('theatre')) category = 'play';
  else if (segLower.includes('music')) category = 'event';

  // Dates & Schedule
  const start = event.dates?.start || {};
  const dateStr = start.localDate || '';
  const timeStr = start.localTime ? start.localTime.slice(0, 5) : '';
  let scheduleFormatted = 'Live Schedule';
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      scheduleFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (timeStr) scheduleFormatted += ` • ${timeStr}`;
    } catch {}
  }

  const statusCode = event.dates?.status?.code;
  const scheduleStatus = statusCode === 'onsale' ? 'On Sale' : statusCode === 'rescheduled' ? 'Rescheduled' : 'Live Event';

  // Price & Ticket Link
  const priceRanges = event.priceRanges?.[0];
  let priceStr = '';
  let priceVal = 150;
  if (priceRanges) {
    priceStr = `${priceRanges.min || ''} ${priceRanges.currency || 'USD'}`;
    if (priceRanges.max && priceRanges.max !== priceRanges.min) {
      priceStr = `${priceRanges.min} – ${priceRanges.max} ${priceRanges.currency}`;
    }
    priceVal = priceRanges.min || 150;
  }

  const ticketUrl = event.url || null;

  // Description / Note
  const description =
    event.info ||
    event.pleaseNote ||
    `${title} live at ${locationLabel}. Book verified passes and tickets directly.`;

  return {
    id,
    ticketmasterId: event.id,
    indexNumber: String(index + 1).padStart(2, '0'),
    title,
    description,
    synopsis: description,
    posterImage,
    backdropImage,
    genre: genreStr,
    genreTags: genreTags.length > 0 ? genreTags : ['Live Event'],
    formats: ['LIVE', cityName ? cityName.toUpperCase() : 'TOUR'].filter(Boolean),
    venue: locationLabel,
    venueName,
    city: cityName,
    country: countryName,
    date: dateStr,
    time: timeStr,
    scheduleStatus,
    scheduleLabel: locationLabel,
    heroBadge: 'TICKETMASTER OFFICIAL',
    badgeTopRight: cityName || 'Official Tour',
    rating: 4.8,
    duration: '2h 30m',
    price: priceStr,
    priceRM: priceVal,
    ticketUrl,
    isExternalTicket: Boolean(ticketUrl),
    category,
    source: 'ticketmaster',
    primaryAction: {
      label: ticketUrl ? 'Get Tickets' : 'View Event',
      icon: 'ticket',
      external: Boolean(ticketUrl),
      link: ticketUrl || `/events/${id}`,
    },
    secondaryAction: {
      label: 'More Info',
      link: ticketUrl || `/events/${id}`,
      external: Boolean(ticketUrl),
    },
    attribution: 'Event data and official ticketing powered by Ticketmaster Discovery API.',
  };
}

export const ticketmasterService = {
  /**
   * Search / discover events with optional keyword, city, country, or classification
   */
  async getEvents({ keyword, city, countryCode, classificationName, page = 0, size = 20 } = {}) {
    const params = {
      size,
      page,
      sort: 'date,asc',
    };

    if (keyword) params.keyword = keyword;
    if (city) params.city = city;
    if (countryCode) params.countryCode = countryCode;
    if (classificationName) params.classificationName = classificationName;

    const data = await fetchTicketmaster('/events.json', params);
    const rawEvents = data._embedded?.events || [];
    const formatted = rawEvents.map((e, idx) => formatTmEvent(e, idx, 'event'));

    return {
      page: data.page?.number || 0,
      totalPages: data.page?.totalPages || 1,
      totalElements: data.page?.totalElements || formatted.length,
      events: formatted,
    };
  },

  /**
   * Sports Events (Live Matches, Tournaments, Racing)
   */
  async getSports({ keyword, city, countryCode, page = 0, size = 20 } = {}) {
    return this.getEvents({
      keyword,
      city,
      countryCode,
      classificationName: 'sports',
      page,
      size,
    });
  },

  /**
   * Theatre & Stage Plays
   */
  async getPlays({ keyword, city, countryCode, page = 0, size = 20 } = {}) {
    return this.getEvents({
      keyword,
      city,
      countryCode,
      classificationName: 'theatre',
      page,
      size,
    });
  },

  /**
   * Comedy Shows
   */
  async getComedy({ keyword, city, countryCode, page = 0, size = 20 } = {}) {
    return this.getEvents({
      keyword,
      city,
      countryCode,
      classificationName: 'comedy',
      page,
      size,
    });
  },

  /**
   * Music & Concerts
   */
  async getMusic({ keyword, city, countryCode, page = 0, size = 20 } = {}) {
    return this.getEvents({
      keyword,
      city,
      countryCode,
      classificationName: 'music',
      page,
      size,
    });
  },

  /**
   * Get single Ticketmaster event details by ID
   */
  async getEventById(id) {
    const cleanId = id.replace(/^tm-/, '');
    const data = await fetchTicketmaster(`/events/${cleanId}.json`, {}, { ttlMs: 60 * 60 * 1000 });
    return formatTmEvent(data, 0);
  },
};
