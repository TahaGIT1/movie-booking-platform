/**
 * CineVerse API Service Layer
 * 
 * Communicates directly with the backend and database APIs.
 * Connects to VITE_API_BASE_URL (defaults to /api with Vite dev proxy).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const DEFAULT_FALLBACK_MOVIES = [
  {
    id: 'the-batman',
    indexNumber: '01',
    title: 'The Batman',
    scheduleStatus: 'Tomorrow',
    scheduleLabel: 'Session schedule',
    heroBadge: 'BLOCKBUSTER',
    badgeTopRight: 'Tomorrow',
    rating: 4.5,
    genre: 'action, crime, mystery',
    genreTags: ['Action', 'Drama', 'Sci-Fi'],
    formats: ['IMAX 2D', 'PG-13'],
    description: 'When a sadistic serial killer begins murdering key political figures in the Gotham... hidden corruption and question his family involvement.',
    posterImage: '/images/movies/the-batman.jpg',
    backdropImage: '/images/backgrounds/batman_hero.jpg',
    primaryAction: { label: 'Book Now', icon: 'ticket', link: '/book/the-batman' },
    secondaryAction: { label: 'More Info', link: '/movie/the-batman' },
    statusCategory: 'now',
    duration: '2h 56m',
    director: 'Matt Reeves',
    cast: ['Robert Pattinson', 'Zoë Kravitz', 'Paul Dano', 'Colin Farrell'],
    priceRM: 38,
    category: 'movie',
  },
  {
    id: 'dune',
    indexNumber: '02',
    title: 'Dune: Part Two',
    scheduleStatus: 'Tomorrow',
    scheduleLabel: 'Session schedule',
    heroBadge: 'EPIC SCI-FI',
    badgeTopRight: 'Tomorrow',
    rating: 4.8,
    genre: 'action, sci-fi, adventure',
    genreTags: ['Sci-Fi', 'Drama', 'Action'],
    formats: ['IMAX 3D', 'PG-13'],
    description: 'Paul Atreides leads nomadic tribes in a battle to control the desert planet Arrakis, where the most valuable substance in the universe is harvested.',
    posterImage: '/images/movies/dune.jpg',
    backdropImage: '/images/backgrounds/dune_hero.jpg',
    primaryAction: { label: 'Book Now', icon: 'ticket', link: '/book/dune' },
    secondaryAction: { label: 'More Info', link: '/movie/dune' },
    statusCategory: 'now',
    duration: '2h 46m',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
    priceRM: 36,
    category: 'movie',
  },
  {
    id: 'avatar',
    indexNumber: '03',
    title: 'Avatar: The Way of Water',
    scheduleStatus: 'Schedule',
    scheduleLabel: 'Tomorrow',
    heroBadge: 'BLOCKBUSTER',
    badgeTopRight: 'Schedule',
    rating: 4.7,
    genre: 'action, sci-fi, adventure',
    genreTags: ['Sci-Fi', 'Action'],
    formats: ['IMAX 3D', 'PG-13'],
    description: 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns, Jake must fight alongside the Na\'vi.',
    posterImage: '/images/movies/avatar.jpg',
    backdropImage: '/images/backgrounds/avatar_hero.jpg',
    primaryAction: { label: 'Book Now', icon: 'ticket', link: '/book/avatar' },
    secondaryAction: { label: 'More Info', link: '/movie/avatar' },
    statusCategory: 'now',
    duration: '3h 12m',
    director: 'James Cameron',
    cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver', 'Kate Winslet'],
    priceRM: 40,
    category: 'movie',
  },
  {
    id: 'inception',
    indexNumber: '04',
    title: 'Inception (Special Screening)',
    scheduleStatus: 'Schedule',
    scheduleLabel: 'Schedule',
    heroBadge: 'MASTERPIECE',
    badgeTopRight: 'Schedule',
    rating: 4.9,
    genre: 'action, sci-fi, mystery',
    genreTags: ['Action', 'Sci-Fi'],
    formats: ['IMAX 2D', 'PG-13'],
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    posterImage: '/images/movies/inception.jpg',
    backdropImage: '/images/backgrounds/inception_hero.jpg',
    primaryAction: { label: 'Book Now', icon: 'ticket', link: '/book/inception' },
    secondaryAction: { label: 'More Info', link: '/movie/inception' },
    statusCategory: 'now',
    duration: '2h 28m',
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy'],
    priceRM: 32,
    category: 'movie',
  },
  {
    id: 'oppenheimer',
    indexNumber: '05',
    title: 'Oppenheimer',
    scheduleStatus: 'Now Showing',
    scheduleLabel: 'Daily Screenings',
    heroBadge: 'OSCAR WINNER',
    badgeTopRight: 'Dolby Atmos',
    rating: 4.9,
    genre: 'biography, drama, history',
    genreTags: ['Drama'],
    formats: ['IMAX 70MM', 'R-18'],
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    posterImage: '/images/movies/oppenheimer.jpg',
    backdropImage: '/images/backgrounds/batman_hero.jpg',
    primaryAction: { label: 'Book Now', icon: 'ticket', link: '/book/oppenheimer' },
    secondaryAction: { label: 'More Info', link: '/movie/oppenheimer' },
    statusCategory: 'now',
    duration: '3h 00m',
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
    priceRM: 42,
    category: 'movie',
  },
  {
    id: 'gladiator-2',
    indexNumber: '06',
    title: 'Gladiator II',
    scheduleStatus: 'Tickets Open',
    scheduleLabel: 'Nov 14',
    heroBadge: 'ANTICIPATED',
    badgeTopRight: 'Coming Soon',
    rating: 4.8,
    genre: 'action, adventure, drama',
    genreTags: ['Action', 'Drama'],
    formats: ['IMAX 2D', '4DX', '18+'],
    description: 'Years after witnessing the death of Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by emperors.',
    posterImage: '/images/movies/gladiator2.jpg',
    backdropImage: '/images/backgrounds/dune_hero.jpg',
    primaryAction: { label: 'Pre-Book', icon: 'ticket', link: '/book/gladiator-2' },
    secondaryAction: { label: 'More Info', link: '/movie/gladiator-2' },
    statusCategory: 'upcoming',
    duration: '2h 30m',
    director: 'Ridley Scott',
    cast: ['Paul Mescal', 'Pedro Pascal', 'Denzel Washington', 'Connie Nielsen'],
    priceRM: 35,
    category: 'movie',
  },
  {
    id: 'deadpool-wolverine',
    indexNumber: '07',
    title: 'Deadpool & Wolverine',
    scheduleStatus: 'Now Showing',
    scheduleLabel: 'Trending #1',
    heroBadge: 'BOX OFFICE RECORD',
    badgeTopRight: 'IMAX 3D',
    rating: 4.7,
    genre: 'action, comedy, sci-fi',
    genreTags: ['Action', 'Sci-Fi'],
    formats: ['IMAX 3D', '4DX', '18+'],
    description: 'Wade Wilson\'s peaceful civilian life is shattered when the Time Variance Authority pulls him into a new mission, teaming him with Wolverine.',
    posterImage: '/images/movies/deadpool-wolverine.jpg',
    backdropImage: '/images/backgrounds/batman_hero.jpg',
    primaryAction: { label: 'Book Now', icon: 'ticket', link: '/book/deadpool-wolverine' },
    secondaryAction: { label: 'More Info', link: '/movie/deadpool-wolverine' },
    statusCategory: 'now',
    duration: '2h 08m',
    director: 'Shawn Levy',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin', 'Matthew Macfadyen'],
    priceRM: 38,
    category: 'movie',
  },
  {
    id: 'interstellar',
    indexNumber: '08',
    title: 'Interstellar (10th Anniversary IMAX)',
    scheduleStatus: 'Selling Fast',
    scheduleLabel: 'Limited Release',
    heroBadge: '10TH ANNIVERSARY',
    badgeTopRight: 'IMAX 70MM',
    rating: 5.0,
    genre: 'adventure, drama, sci-fi',
    genreTags: ['Sci-Fi', 'Drama'],
    formats: ['IMAX 70MM', 'PG-13'],
    description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked with piloting a spacecraft along with a team of researchers.',
    posterImage: '/images/movies/interstellar.jpg',
    backdropImage: '/images/backgrounds/avatar_hero.jpg',
    primaryAction: { label: 'Book Now', icon: 'ticket', link: '/book/interstellar' },
    secondaryAction: { label: 'More Info', link: '/movie/interstellar' },
    statusCategory: 'now',
    duration: '2h 49m',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
    priceRM: 45,
    category: 'movie',
  },
];

export const DEFAULT_FALLBACK_THEATRES = [
  {
    id: 'pavilion-elite-imax',
    name: 'Dadi Cinema & IMAX Pavilion Elite',
    location: 'Level 7, Pavilion Kuala Lumpur, Bukit Bintang',
    city: 'Kuala Lumpur',
    distance: '1.2 km away',
    features: ['IMAX with Laser', 'Star-Max Bed Lounge', 'Dolby Atmos', 'Gourmet Bar'],
    showtimes: [
      { format: 'IMAX Laser 2D', times: ['11:30 AM', '02:45 PM', '06:15 PM', '09:30 PM', '12:15 AM'], price: 38 },
      { format: 'Dolby Atmos', times: ['12:30 PM', '03:45 PM', '07:00 PM', '10:15 PM'], price: 26 },
      { format: 'Star-Max VIP Bed', times: ['04:00 PM', '08:00 PM', '11:00 PM'], price: 90 },
    ],
  },
  {
    id: 'gsc-mid-valley',
    name: 'GSC Mid Valley Megamall',
    location: 'Level 3, Mid Valley Megamall, Lingkaran Syed Putra',
    city: 'Kuala Lumpur',
    distance: '4.8 km away',
    features: ['ScreenX 270°', '4DX Motion', 'Dolby Atmos', 'Premiere Class'],
    showtimes: [
      { format: 'ScreenX 270°', times: ['01:15 PM', '04:30 PM', '07:45 PM', '10:45 PM'], price: 32 },
      { format: '4DX Motion & Effects', times: ['12:00 PM', '03:15 PM', '06:30 PM', '09:45 PM'], price: 35 },
      { format: 'Digital 2D', times: ['10:45 AM', '01:50 PM', '05:00 PM', '08:15 PM', '11:20 PM'], price: 22 },
    ],
  },
  {
    id: 'tgv-sunway-pyramid',
    name: 'TGV Sunway Pyramid IMAX',
    location: 'F1.M1, Sunway Pyramid Shopping Mall, Bandar Sunway',
    city: 'Petaling Jaya',
    distance: '14.2 km away',
    features: ['IMAX 12-Track Sound', 'INDULGE Luxury Suites', 'Beanie Beanbag Hall'],
    showtimes: [
      { format: 'IMAX 2D', times: ['11:00 AM', '02:15 PM', '05:30 PM', '08:45 PM'], price: 36 },
      { format: 'INDULGE Luxury', times: ['01:00 PM', '04:30 PM', '07:30 PM', '10:30 PM'], price: 75 },
      { format: 'Standard 2D', times: ['10:30 AM', '01:30 PM', '04:30 PM', '07:30 PM', '10:30 PM'], price: 20 },
    ],
  },
];

export const DEFAULT_FALLBACK_OFFERS = [
  {
    id: 'maybank-1for1',
    title: 'Maybank 1-for-1 IMAX Movie Tickets',
    code: 'MBBIMAX',
    discount: 'Buy 1 Free 1',
    description: 'Get a complimentary IMAX ticket every Saturday & Sunday with Maybank Cards.',
    validUntil: '31 Dec 2024',
    bannerImage: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80',
    category: 'Bank Promo',
  },
  {
    id: 'student-thursday',
    title: 'Student Special: Flat RM14 Tickets',
    code: 'STUDENT14',
    discount: 'Flat RM14',
    description: 'Valid for all standard 2D showtimes on Thursdays before 6:00 PM with valid student ID.',
    validUntil: 'Every Thursday',
    bannerImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
    category: 'Student Deal',
  },
];

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

  async login(emailOrCreds, password) {
    let payload;
    if (typeof emailOrCreds === 'object' && emailOrCreds !== null) {
      payload = emailOrCreds;
    } else {
      payload = { email: emailOrCreds, password };
    }
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

  async register(nameOrPayload, email, password, mobileNumber) {
    let payload;
    if (typeof nameOrPayload === 'object' && nameOrPayload !== null) {
      payload = { role: 'CUSTOMER', ...nameOrPayload };
    } else {
      payload = { fullName: nameOrPayload, email, password, mobileNumber: mobileNumber || undefined, role: 'CUSTOMER' };
    }
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
      if (res.ok) {
        const result = await res.json();
        const rawList = Array.isArray(result) ? result : (result.data || []);
        if (rawList.length > 0) {
          return rawList.map((item, idx) => normalizeMediaItem(item, idx)).filter(Boolean);
        }
      }
      return DEFAULT_FALLBACK_MOVIES;
    } catch (err) {
      console.warn('Backend DB not reachable, using catalog fallback:', err);
      return DEFAULT_FALLBACK_MOVIES;
    }
  },

  async getMovieById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/movies/${encodeURIComponent(id)}`);
      if (res.ok) {
        const result = await res.json();
        const raw = result.data || result;
        if (raw) return normalizeMediaItem(raw, 0);
      }
      return DEFAULT_FALLBACK_MOVIES.find(m => m.id === id) || null;
    } catch (err) {
      console.warn('Error fetching movie by ID from DB, using fallback:', err);
      return DEFAULT_FALLBACK_MOVIES.find(m => m.id === id) || null;
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
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        if (list.length > 0) return list;
      }
      return DEFAULT_FALLBACK_THEATRES;
    } catch {
      return DEFAULT_FALLBACK_THEATRES;
    }
  },

  async getOffers() {
    try {
      const res = await fetch(`${API_BASE_URL}/offers`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        if (list.length > 0) return list;
      }
      return DEFAULT_FALLBACK_OFFERS;
    } catch {
      return DEFAULT_FALLBACK_OFFERS;
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

  // Admin Movie Operations
  async createMovie(movieData) {
    const res = await fetch(`${API_BASE_URL}/admin/movies`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(movieData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || data.message || 'Failed to create movie');
    return data.data;
  },

  async updateMovie(movieId, movieData) {
    const res = await fetch(`${API_BASE_URL}/admin/movies/${movieId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(movieData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || data.message || 'Failed to update movie');
    return data.data;
  },

  async deleteMovie(movieId) {
    const res = await fetch(`${API_BASE_URL}/admin/movies/${movieId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || data.message || 'Failed to delete movie');
    return data;
  },
};
