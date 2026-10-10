/**
 * CineVerse API Service Layer
 * 
 * Communicates directly with the backend and database APIs.
 * Connects to VITE_API_BASE_URL (defaults to /api with Vite dev proxy).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export function normalizeMediaItem(raw, index = 0) {
  if (!raw) return null;

  const id = String(raw.id || `item-${index + 1}`);
  const title = raw.title || 'Untitled';
  const rawGenres = Array.isArray(raw.genres) && raw.genres.length > 0
    ? raw.genres
    : (typeof raw.genres === 'string' && raw.genres ? raw.genres.split(',').map(g => g.trim()) : []);

  const censor = raw.censorCertificate || 'U/A';
  const rawFormats = Array.isArray(raw.formats) && raw.formats.length > 0
    ? raw.formats
    : (raw.shows?.map(s => s.visualFormat) || ['2D']);

  const uniqueFormats = Array.from(new Set(rawFormats));
  if (uniqueFormats.length === 0) uniqueFormats.push('2D');
  if (censor && !uniqueFormats.includes(censor)) uniqueFormats.unshift(censor);

  const poster = raw.posterUrl || raw.posterImage || '';
  const backdrop = raw.backdropUrl || raw.backdropImage || poster;

  return {
    id,
    indexNumber: String(index + 1).padStart(2, '0'),
    title,
    tagline: raw.synopsis ? (raw.synopsis.slice(0, 60) + '...') : (rawGenres.join(' • ') || 'Now in Theatres'),
    scheduleStatus: raw.scheduleStatus || 'Now Showing',
    scheduleLabel: raw.scheduleLabel || 'Cinema schedule',
    heroBadge: index === 0 ? 'FEATURED' : undefined,
    badgeTopRight: raw.badgeTopRight || undefined,
    rating: typeof raw.rating === 'number' ? raw.rating : 4.5,
    genre: rawGenres.join(', ') || 'Feature',
    genreTags: rawGenres,
    formats: uniqueFormats,
    description: raw.synopsis || raw.description || '',
    posterImage: poster,
    backdropImage: backdrop,
    primaryAction: {
      label: 'Book Now',
      icon: 'ticket',
      link: `/book/${id}`,
    },
    secondaryAction: {
      label: 'More Info',
      link: `/movie/${id}`,
    },
    statusCategory: raw.statusCategory || 'now',
    duration: raw.durationMinutes
      ? `${Math.floor(raw.durationMinutes / 60)}h ${raw.durationMinutes % 60}m`
      : (raw.duration || ''),
    director: raw.director || '',
    cast: Array.isArray(raw.castMembers) ? raw.castMembers : [],
    trailerUrl: raw.trailerUrl || '',
    priceRM: raw.priceRM || 250,
    category: 'movie',
  };
}

export const api = {
  // ==================== AUTHENTICATION ====================
  getToken() {
    return localStorage.getItem('token') || localStorage.getItem('cinepass_token');
  },

  getCurrentUser() {
    const raw = localStorage.getItem('user') || localStorage.getItem('cinepass_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(body.error?.message || body.message || 'Login failed');
    }
    if (body.data?.accessToken) {
      localStorage.setItem('token', body.data.accessToken);
      localStorage.setItem('cinepass_token', body.data.accessToken);
    }
    if (body.data?.user) {
      localStorage.setItem('user', JSON.stringify(body.data.user));
      localStorage.setItem('cinepass_user', JSON.stringify(body.data.user));
    }
    return { success: true, data: body.data };
  },

  async register(fullName, email, password, mobileNumber) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, mobileNumber: mobileNumber || undefined, role: 'CUSTOMER' }),
    });
    const body = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(body.error?.message || body.message || 'Registration failed');
    }
    if (body.data?.accessToken) {
      localStorage.setItem('token', body.data.accessToken);
      localStorage.setItem('cinepass_token', body.data.accessToken);
    }
    if (body.data?.user) {
      localStorage.setItem('user', JSON.stringify(body.data.user));
      localStorage.setItem('cinepass_user', JSON.stringify(body.data.user));
    }
    return { success: true, data: body.data };
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cinepass_token');
    localStorage.removeItem('cinepass_user');
    try {
      fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: this.getAuthHeaders() });
    } catch {
      // Ignore network errors on logout
    }
  },

  // ==================== MOVIES & CATALOG ====================
  async getMovies(params) {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.genre) query.set('genre', params.genre);
      const qs = query.toString() ? `?${query.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/movies${qs}`);
      if (!res.ok) return [];
      const result = await res.json();
      const rawList = Array.isArray(result) ? result : (result.data || []);
      return rawList.map((item, idx) => normalizeMediaItem(item, idx)).filter(Boolean);
    } catch (err) {
      console.warn('Error fetching movies from DB:', err);
      return [];
    }
  },

  async getMovieById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/movies/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const result = await res.json();
      const raw = result.data || result;
      return raw ? normalizeMediaItem(raw, 0) : null;
    } catch (err) {
      console.warn('Error fetching movie by ID from DB:', err);
      return null;
    }
  },

  // Events, Streams, Plays, Sports, Activities
  async getEvents() {
    try {
      const res = await fetch(`${API_BASE_URL}/events`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    } catch (err) {
      console.warn('Error fetching events from DB:', err);
      return [];
    }
  },

  async getEventById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getStreams() {
    try {
      const res = await fetch(`${API_BASE_URL}/streams`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    } catch (err) {
      console.warn('Error fetching streams from DB:', err);
      return [];
    }
  },

  async getStreamById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/streams/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getPlays() {
    try {
      const res = await fetch(`${API_BASE_URL}/plays`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    } catch (err) {
      console.warn('Error fetching plays from DB:', err);
      return [];
    }
  },

  async getPlayById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/plays/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getSports() {
    try {
      const res = await fetch(`${API_BASE_URL}/sports`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    } catch (err) {
      console.warn('Error fetching sports from DB:', err);
      return [];
    }
  },

  async getSportById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/sports/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getActivities() {
    try {
      const res = await fetch(`${API_BASE_URL}/activities`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    } catch (err) {
      console.warn('Error fetching activities from DB:', err);
      return [];
    }
  },

  async getActivityById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/activities/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getTheatres(city) {
    try {
      const url = city && city !== 'All Cities'
        ? `${API_BASE_URL}/theatres?city=${encodeURIComponent(city)}`
        : `${API_BASE_URL}/theatres`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    } catch (err) {
      console.warn('Error fetching theatres from DB:', err);
      return [];
    }
  },

  async getOffers() {
    try {
      const res = await fetch(`${API_BASE_URL}/offers`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data || []);
    } catch (err) {
      console.warn('Error fetching offers from DB:', err);
      return [];
    }
  },

  // ==================== SEAT LOCKING & BOOKINGS ====================
  async lockSeats(showId, seatIds) {
    const res = await fetch(`${API_BASE_URL}/shows/${encodeURIComponent(showId)}/seats/lock`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ seatIds }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error?.message || 'Seats already locked or unavailable');
    }
    return data;
  },

  async releaseSeats(showId, seatIds) {
    try {
      const res = await fetch(`${API_BASE_URL}/shows/${encodeURIComponent(showId)}/seats/release`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ seatIds }),
      });
      return await res.json();
    } catch {
      return { success: true };
    }
  },

  async getOccupiedSeats(theatre, date, time) {
    try {
      const url = `${API_BASE_URL}/bookings/occupied-seats?theatre=${encodeURIComponent(theatre)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return data.occupiedSeats || [];
    } catch {
      return [];
    }
  },

  async getBookings() {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data || []);
    } catch {
      return [];
    }
  },

  async createBooking(payload) {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || data.message || 'Booking creation failed');
    }
    return data;
  },

  // Unified Search
  async search(query) {
    try {
      const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return { movies: [], theatres: [] };
      return await res.json();
    } catch {
      return { movies: [], theatres: [] };
    }
  },
};
