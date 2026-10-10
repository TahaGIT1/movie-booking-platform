import dns from 'dns';
import { prisma } from '../config/prisma.js';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_POSTER = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMAGE_BASE_BACKDROP = 'https://image.tmdb.org/t/p/original';
const TMDB_IMAGE_BASE_PROFILE = 'https://image.tmdb.org/t/p/w185';

// Genre ID map for TMDB standard genres
const TMDB_GENRES = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

import https from 'https';

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

function httpsGetJson(urlStr, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      urlStr,
      {
        lookup: customLookup,
        headers: {
          'User-Agent': 'CineVerse-Platform/1.0',
          'Accept': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`TMDB HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`Failed to parse TMDB JSON: ${e.message}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy(new Error('TMDB request timed out'));
    });
  });
}

// In-memory cache with TTL to prevent rate limits and optimize latency
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

function setToCache(key, data, ttlMs = 15 * 60 * 1000) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Fetch from TMDB with retry, Bearer token / API key support, and network error handling
 */
async function fetchTmdb(endpoint, params = {}, options = {}) {
  const apiKey = process.env.TMDB_API_KEY || '14c053e51829e0228370dd63952070ac';
  const readToken = process.env.TMDB_READ_ACCESS_TOKEN;

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', 'en-US');

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      url.searchParams.set(k, String(v));
    }
  }

  const cacheKey = url.toString();
  const cached = getFromCache(cacheKey);
  if (cached && !options.noCache) {
    return cached;
  }

  const headers = {};
  if (readToken) {
    headers['Authorization'] = `Bearer ${readToken}`;
  }

  let lastError = null;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await httpsGetJson(url.toString(), headers);
      setToCache(cacheKey, data, options.ttlMs || 20 * 60 * 1000); // 20 minutes default cache
      return data;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
      }
    }
  }

  console.warn(`[TMDB Service] Error fetching ${endpoint}:`, lastError?.message);
  throw lastError;
}


/**
 * Map TMDB Movie to CineVerse Frontend Format and link with DB showtimes if available
 */
export async function formatTmdbMovie(m, dbMatchesMap = null) {
  if (!m) return null;

  // Extract genres
  let genreTags = [];
  if (Array.isArray(m.genres) && m.genres.length > 0) {
    genreTags = m.genres.map((g) => (typeof g === 'string' ? g : g.name)).filter(Boolean);
  } else if (Array.isArray(m.genre_ids)) {
    genreTags = m.genre_ids.map((id) => TMDB_GENRES[id] || 'Cinema').filter(Boolean);
  }
  if (genreTags.length === 0) genreTags = ['Action', 'Drama'];

  // Extract cast & director
  let director = null;
  let cast = [];
  let castMembers = [];

  if (m.credits) {
    if (Array.isArray(m.credits.crew)) {
      const dirObj = m.credits.crew.find((c) => c.job === 'Director');
      if (dirObj) director = dirObj.name;
    }
    if (Array.isArray(m.credits.cast)) {
      cast = m.credits.cast.slice(0, 6).map((c) => c.name);
      castMembers = m.credits.cast.slice(0, 8).map((c) => ({
        name: c.name,
        character: c.character || 'Cast',
        profileUrl: c.profile_path ? `${TMDB_IMAGE_BASE_PROFILE}${c.profile_path}` : null,
      }));
    }
  }

  // Extract trailer video (YouTube)
  let trailerUrl = null;
  let trailerKey = null;
  if (m.videos && Array.isArray(m.videos.results)) {
    const ytTrailers = m.videos.results.filter(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    const chosenTrailer = ytTrailers.find((v) => v.type === 'Trailer') || ytTrailers[0];
    if (chosenTrailer?.key) {
      trailerKey = chosenTrailer.key;
      trailerUrl = `https://www.youtube.com/watch?v=${chosenTrailer.key}`;
    }
  }

  // Runtime calculation
  const runtime = m.runtime || 120;
  const hours = Math.floor(runtime / 60);
  const mins = runtime % 60;
  const durationStr = `${hours}h ${mins.toString().padStart(2, '0')}m`;

  // Look up if this movie exists in our PostgreSQL DB to preserve real theatre bookings
  let matchedDbMovie = null;
  if (dbMatchesMap && dbMatchesMap.has(m.title.toLowerCase().trim())) {
    matchedDbMovie = dbMatchesMap.get(m.title.toLowerCase().trim());
  }

  const hasLiveShows = Boolean(matchedDbMovie && matchedDbMovie.shows && matchedDbMovie.shows.length > 0);

  // Formats
  const formats = ['IMAX 2D', 'Dolby Atmos', '4DX'];

  // Rating (scaled to 5.0 with 1 decimal)
  const ratingRaw = m.vote_average || 8.0;
  const rating = Number((ratingRaw / 2).toFixed(1));

  const tmdbId = m.id;
  const identifier = String(tmdbId);

  return {
    id: identifier,
    tmdbId,
    dbMovieId: matchedDbMovie ? matchedDbMovie.id : null,
    title: m.title || m.original_title,
    originalTitle: m.original_title,
    tagline: m.tagline || (m.release_date ? `Releasing ${m.release_date}` : 'Now in theatres'),
    description: m.overview || 'Experience this cinematic release on the big screen.',
    synopsis: m.overview || '',
    posterImage: m.poster_path
      ? `${TMDB_IMAGE_BASE_POSTER}${m.poster_path}`
      : '/images/movies/the-batman.jpg',
    backdropImage: m.backdrop_path
      ? `${TMDB_IMAGE_BASE_BACKDROP}${m.backdrop_path}`
      : m.poster_path
        ? `${TMDB_IMAGE_BASE_BACKDROP}${m.poster_path}`
        : '/images/backgrounds/batman_hero.jpg',
    rating,
    voteCount: m.vote_count || 1200,
    genre: genreTags.join(', ').toLowerCase(),
    genreTags,
    genres: genreTags,
    formats,
    duration: durationStr,
    durationMinutes: runtime,
    director: director || 'Visionary Director',
    cast: cast.length > 0 ? cast : ['Featured Cast'],
    castMembers,
    releaseDate: m.release_date || null,
    trailerUrl: trailerUrl || 'https://www.youtube.com/watch?v=mqqft2x_Aa4',
    trailerKey,
    hasLiveShows,
    shows: matchedDbMovie?.shows || [],
    statusCategory: 'now',
    primaryAction: {
      label: hasLiveShows ? 'Book Seats' : 'Book Tickets',
      icon: 'ticket',
      link: hasLiveShows ? `/book/${matchedDbMovie.id}` : `/movie/${identifier}`,
    },
    secondaryAction: {
      label: 'More Info',
      link: `/movie/${identifier}`,
    },
    category: 'movie',
    attribution: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
  };
}

/**
 * Pre-load DB movies map for matching
 */
async function getDbMoviesMap() {
  try {
    const dbMovies = await prisma.movie.findMany({
      include: {
        shows: {
          include: { theatre: true, screen: true },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    const map = new Map();
    for (const m of dbMovies) {
      map.set(m.title.toLowerCase().trim(), m);
    }
    return map;
  } catch (err) {
    console.warn('[TMDB Service] Failed to fetch DB movies for matching:', err.message);
    return new Map();
  }
}

export const tmdbService = {
  /**
   * Now Playing in Theatres
   */
  async getNowPlaying(page = 1) {
    const [tmdbData, dbMap] = await Promise.all([
      fetchTmdb('/movie/now_playing', { page }),
      getDbMoviesMap(),
    ]);

    const results = tmdbData.results || [];
    const formatted = await Promise.all(
      results.map((m, idx) =>
        formatTmdbMovie(m, dbMap).then((item) => ({
          ...item,
          indexNumber: (idx + 1).toString().padStart(2, '0'),
          scheduleStatus: 'Now Showing',
          badgeTopRight: 'In Cinemas',
        }))
      )
    );

    return {
      page: tmdbData.page || 1,
      totalPages: tmdbData.total_pages || 1,
      totalResults: tmdbData.total_results || formatted.length,
      movies: formatted,
    };
  },

  /**
   * Upcoming Movies (Coming Soon)
   */
  async getUpcoming(page = 1) {
    const [tmdbData, dbMap] = await Promise.all([
      fetchTmdb('/movie/upcoming', { page }),
      getDbMoviesMap(),
    ]);

    const results = tmdbData.results || [];
    const formatted = await Promise.all(
      results.map((m, idx) =>
        formatTmdbMovie(m, dbMap).then((item) => ({
          ...item,
          indexNumber: (idx + 1).toString().padStart(2, '0'),
          scheduleStatus: 'Coming Soon',
          badgeTopRight: 'Advance Booking',
          statusCategory: 'upcoming',
        }))
      )
    );

    return {
      page: tmdbData.page || 1,
      totalPages: tmdbData.total_pages || 1,
      totalResults: tmdbData.total_results || formatted.length,
      movies: formatted,
    };
  },

  /**
   * Trending Movies (Day or Week)
   */
  async getTrending(timeWindow = 'week', page = 1) {
    const [tmdbData, dbMap] = await Promise.all([
      fetchTmdb(`/trending/movie/${timeWindow}`, { page }),
      getDbMoviesMap(),
    ]);

    const results = tmdbData.results || [];
    const formatted = await Promise.all(
      results.map((m, idx) =>
        formatTmdbMovie(m, dbMap).then((item) => ({
          ...item,
          indexNumber: (idx + 1).toString().padStart(2, '0'),
          scheduleStatus: 'Trending',
          heroBadge: 'TRENDING WORLDWIDE',
          badgeTopRight: 'Popular',
        }))
      )
    );

    return {
      page: tmdbData.page || 1,
      totalPages: tmdbData.total_pages || 1,
      totalResults: tmdbData.total_results || formatted.length,
      movies: formatted,
    };
  },

  /**
   * Popular Movies
   */
  async getPopular(page = 1) {
    const [tmdbData, dbMap] = await Promise.all([
      fetchTmdb('/movie/popular', { page }),
      getDbMoviesMap(),
    ]);

    const results = tmdbData.results || [];
    const formatted = await Promise.all(
      results.map((m, idx) =>
        formatTmdbMovie(m, dbMap).then((item) => ({
          ...item,
          indexNumber: (idx + 1).toString().padStart(2, '0'),
          scheduleStatus: 'Popular',
          badgeTopRight: 'Top Rated',
        }))
      )
    );

    return {
      page: tmdbData.page || 1,
      totalPages: tmdbData.total_pages || 1,
      totalResults: tmdbData.total_results || formatted.length,
      movies: formatted,
    };
  },

  /**
   * Search Movies via TMDB
   */
  async searchMovies(query, page = 1) {
    if (!query || query.trim() === '') {
      return { page: 1, totalPages: 1, totalResults: 0, movies: [] };
    }

    const [tmdbData, dbMap] = await Promise.all([
      fetchTmdb('/search/movie', { query, page }, { ttlMs: 5 * 60 * 1000 }),
      getDbMoviesMap(),
    ]);

    const results = tmdbData.results || [];
    const formatted = await Promise.all(
      results.map((m, idx) =>
        formatTmdbMovie(m, dbMap).then((item) => ({
          ...item,
          indexNumber: (idx + 1).toString().padStart(2, '0'),
        }))
      )
    );

    return {
      page: tmdbData.page || 1,
      totalPages: tmdbData.total_pages || 1,
      totalResults: tmdbData.total_results || formatted.length,
      movies: formatted,
    };
  },

  /**
   * Movie Details with Credits, Videos, and Showtimes
   */
  async getMovieDetails(tmdbId) {
    const [tmdbData, dbMap] = await Promise.all([
      fetchTmdb(`/movie/${tmdbId}`, { append_to_response: 'videos,credits,similar' }, { ttlMs: 60 * 60 * 1000 }),
      getDbMoviesMap(),
    ]);

    return formatTmdbMovie(tmdbData, dbMap);
  },

  /**
   * Movie Trailers
   */
  async getMovieTrailers(tmdbId) {
    const tmdbData = await fetchTmdb(`/movie/${tmdbId}/videos`, {}, { ttlMs: 60 * 60 * 1000 });
    const results = tmdbData.results || [];
    return results.filter((v) => v.site === 'YouTube');
  },
};
