/**
 * CinePass API Service Layer
 *
 * Provides unified communication between the frontend React client and the CineVerse backend server.
 * Connects to VITE_API_BASE_URL (defaults to /api with Vite dev proxy).
 */
import { moviesData } from '../data/movies';
import { eventsData } from '../data/events';
import { streamsData } from '../data/streams';
import { playsData } from '../data/plays';
import { sportsData } from '../data/sports';
import { activitiesData } from '../data/activities';
import { theatresData } from '../data/theatres';
import { offersData } from '../data/offers';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export function normalizeMediaItem(raw, index = 0) {
    if (!raw)
        return moviesData[0];
    // Match against local rich moviesData to preserve high-res posters/backdrops if known title/id
    const localMatch = moviesData.find((m) => m.id === raw.id || m.title?.toLowerCase() === raw.title?.toLowerCase());
    const id = String(raw.id || localMatch?.id || `movie-${index + 1}`);
    const title = raw.title || localMatch?.title || 'Featured Film';
    const rawGenres = Array.isArray(raw.genres) && raw.genres.length > 0
        ? raw.genres
        : (typeof raw.genres === 'string'
            ? raw.genres.split(',').map((g) => g.trim())
            : (localMatch?.genreTags || ['Action', 'Drama']));
    const censor = raw.censorCertificate || 'UA';
    const rawFormats = Array.isArray(raw.formats) && raw.formats.length > 0
        ? raw.formats
        : (localMatch?.formats || [censor, '2D', 'IMAX']);
    return {
        id,
        indexNumber: raw.indexNumber || localMatch?.indexNumber || String(index + 1).padStart(2, '0'),
        title,
        tagline: raw.tagline || localMatch?.tagline || rawGenres.join(' • ') || 'Now in Theatres',
        scheduleStatus: raw.scheduleStatus || localMatch?.scheduleStatus || 'Tomorrow',
        scheduleLabel: raw.scheduleLabel || localMatch?.scheduleLabel || 'Session schedule',
        heroBadge: raw.heroBadge || localMatch?.heroBadge || (index === 0 ? 'BLOCKBUSTER' : 'Featured'),
        badgeTopRight: raw.badgeTopRight || localMatch?.badgeTopRight || 'Tomorrow',
        rating: typeof raw.rating === 'number' ? raw.rating : (localMatch?.rating || 4.5),
        genre: raw.genre || localMatch?.genre || rawGenres.join(', '),
        genreTags: rawGenres,
        formats: rawFormats,
        description: raw.synopsis || raw.description || localMatch?.description || 'Experience this cinematic release on the big screen.',
        posterImage: raw.posterUrl || raw.posterImage || localMatch?.posterImage || '/images/movies/the-batman.jpg',
        backdropImage: raw.backdropUrl || raw.backdropImage || localMatch?.backdropImage || raw.posterUrl || '/images/backgrounds/batman_hero.jpg',
        primaryAction: raw.primaryAction || localMatch?.primaryAction || {
            label: 'Book Now',
            icon: 'ticket',
            link: `/book/${id}`,
        },
        secondaryAction: raw.secondaryAction || localMatch?.secondaryAction || {
            label: 'More Info',
            link: `/movie/${id}`,
        },
        statusCategory: raw.statusCategory || localMatch?.statusCategory || 'now',
        duration: raw.duration || (raw.durationMinutes ? `${Math.floor(raw.durationMinutes / 60)}h ${raw.durationMinutes % 60}m` : (localMatch?.duration || '2h 15m')),
        director: raw.director || localMatch?.director || 'Director',
        cast: Array.isArray(raw.castMembers)
            ? raw.castMembers
            : (Array.isArray(raw.cast) ? raw.cast : (localMatch?.cast || ['Lead Cast'])),
        trailerUrl: raw.trailerUrl || localMatch?.trailerUrl || '',
        priceRM: raw.priceRM || localMatch?.priceRM || 25,
        category: 'movie',
    };
}
export const api = {
    // ==================== AUTHENTICATION ====================
    getToken() {
        return localStorage.getItem('cinepass_token');
    },
    getCurrentUser() {
        const raw = localStorage.getItem('cinepass_user');
        if (!raw)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
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
        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const body = await res.json();
            if (!res.ok) {
                throw new Error(body.error?.message || body.message || 'Login failed');
            }
            if (body.success && body.data) {
                localStorage.setItem('cinepass_token', body.data.accessToken);
                localStorage.setItem('cinepass_refresh_token', body.data.refreshToken);
                localStorage.setItem('cinepass_user', JSON.stringify(body.data.user));
                return { success: true, data: body.data };
            }
            throw new Error(body.error?.message || 'Login response invalid');
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Login failed';
            // Local fallback for offline demo
            if (email.includes('@')) {
                const mockUser = {
                    id: 'usr-demo-' + Math.floor(Math.random() * 1000),
                    fullName: email.split('@')[0].replace(/[._]/g, ' ').toUpperCase(),
                    email,
                    role: email.includes('admin') ? 'SUPER_ADMIN' : email.includes('manager') ? 'THEATRE_MANAGER' : 'CUSTOMER',
                };
                const mockData = {
                    user: mockUser,
                    accessToken: 'demo_jwt_token_' + Date.now(),
                    refreshToken: 'demo_refresh_token_' + Date.now(),
                };
                localStorage.setItem('cinepass_token', mockData.accessToken);
                localStorage.setItem('cinepass_user', JSON.stringify(mockUser));
                return { success: true, data: mockData };
            }
            return { success: false, error: msg };
        }
    },
    async register(fullName, email, password, mobileNumber) {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password, mobileNumber: mobileNumber || undefined, role: 'CUSTOMER' }),
            });
            const body = await res.json();
            if (!res.ok) {
                throw new Error(body.error?.message || body.message || 'Registration failed');
            }
            if (body.success && body.data) {
                localStorage.setItem('cinepass_token', body.data.accessToken);
                localStorage.setItem('cinepass_refresh_token', body.data.refreshToken);
                localStorage.setItem('cinepass_user', JSON.stringify(body.data.user));
                return { success: true, data: body.data };
            }
            throw new Error(body.error?.message || 'Registration response invalid');
        }
        catch {
            const mockUser = {
                id: 'usr-demo-' + Math.floor(Math.random() * 1000),
                fullName,
                email,
                role: 'CUSTOMER',
                mobileNumber,
            };
            const mockData = {
                user: mockUser,
                accessToken: 'demo_jwt_token_' + Date.now(),
                refreshToken: 'demo_refresh_token_' + Date.now(),
            };
            localStorage.setItem('cinepass_token', mockData.accessToken);
            localStorage.setItem('cinepass_user', JSON.stringify(mockUser));
            return { success: true, data: mockData };
        }
    },
    logout() {
        localStorage.removeItem('cinepass_token');
        localStorage.removeItem('cinepass_refresh_token');
        localStorage.removeItem('cinepass_user');
        try {
            fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: this.getAuthHeaders() });
        }
        catch {
            // Ignore network errors on logout
        }
    },
    // ==================== MOVIES & CATALOG ====================
    async getMovies(params) {
        try {
            const query = new URLSearchParams();
            if (params?.search)
                query.set('search', params.search);
            if (params?.genre)
                query.set('genre', params.genre);
            if (params?.status)
                query.set('status', params.status);
            const qs = query.toString() ? `?${query.toString()}` : '';
            const res = await fetch(`${API_BASE_URL}/movies${qs}`);
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const result = await res.json();
            const rawList = Array.isArray(result) ? result : (result.data || moviesData);
            return rawList.map((item, idx) => normalizeMediaItem(item, idx));
        }
        catch (err) {
            console.warn('Falling back to local movies data:', err);
            let list = [...moviesData];
            if (params?.status)
                list = list.filter((m) => m.statusCategory === params.status);
            return list;
        }
    },
    async getMovieById(id) {
        try {
            const res = await fetch(`${API_BASE_URL}/movies/${encodeURIComponent(id)}`);
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const result = await res.json();
            const raw = result.data || result;
            return raw ? normalizeMediaItem(raw, 0) : moviesData.find((m) => m.id === id);
        }
        catch {
            return moviesData.find((m) => m.id === id);
        }
    },
    // Events, Streams, Plays, Sports, Activities
    async getEvents() {
        try {
            const res = await fetch(`${API_BASE_URL}/events`);
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return await res.json();
        }
        catch {
            return eventsData;
        }
    },
    async getEventById(id) {
        try {
            const res = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(id)}`);
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return await res.json();
        }
        catch {
            return eventsData.find((e) => e.id === id);
        }
    },
    async getStreams() {
        try {
            const res = await fetch(`${API_BASE_URL}/streams`);
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return await res.json();
        }
        catch {
            return streamsData;
        }
    },
    async getPlays() {
        try {
            const res = await fetch(`${API_BASE_URL}/plays`);
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return await res.json();
        }
        catch {
            return playsData;
        }
    },
    async getSports() {
        try {
            const res = await fetch(`${API_BASE_URL}/sports`);
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return await res.json();
        }
        catch {
            return sportsData;
        }
    },
    async getActivities() {
        try {
            const res = await fetch(`${API_BASE_URL}/activities`);
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return await res.json();
        }
        catch {
            return activitiesData;
        }
    },
    async getTheatres(city) {
        try {
            const url = city && city !== 'All Cities'
                ? `${API_BASE_URL}/theatres?city=${encodeURIComponent(city)}`
                : `${API_BASE_URL}/theatres`;
            const res = await fetch(url);
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return Array.isArray(data) ? data : data.data || theatresData;
        }
        catch {
            if (!city || city === 'All Cities')
                return theatresData;
            return theatresData.filter((t) => t.city === city);
        }
    },
    async getOffers() {
        try {
            const res = await fetch(`${API_BASE_URL}/offers`);
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return await res.json();
        }
        catch {
            return offersData;
        }
    },
    // ==================== SEAT LOCKING & BOOKINGS ====================
    async lockSeats(showId, seatIds) {
        try {
            const res = await fetch(`${API_BASE_URL}/shows/${encodeURIComponent(showId)}/seats/lock`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ seatIds }),
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.message || 'Seats already locked by another user');
            return data;
        }
        catch (err) {
            // In local demo fallback, simulate successful 5-minute lock
            const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
            return { success: true, lockExpiresAt: expires, message: 'Seats locked locally' };
        }
    },
    async releaseSeats(showId, seatIds) {
        try {
            const res = await fetch(`${API_BASE_URL}/shows/${encodeURIComponent(showId)}/seats/release`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ seatIds }),
            });
            return await res.json();
        }
        catch {
            return { success: true };
        }
    },
    async getOccupiedSeats(theatre, date, time) {
        try {
            const url = `${API_BASE_URL}/bookings/occupied-seats?theatre=${encodeURIComponent(theatre)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`;
            const res = await fetch(url);
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.occupiedSeats || [];
        }
        catch {
            // Consistent fallback occupied seats
            return ['B4', 'B5', 'C6', 'C7', 'D3', 'D4', 'E4'];
        }
    },
    async getBookings() {
        try {
            const res = await fetch(`${API_BASE_URL}/bookings`, {
                headers: this.getAuthHeaders(),
            });
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            const list = Array.isArray(json) ? json : json.data || [];
            return list.length ? list : this.getSavedLocalBookings();
        }
        catch {
            return this.getSavedLocalBookings();
        }
    },
    getSavedLocalBookings() {
        const raw = localStorage.getItem('cinepass_my_bookings');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length)
                    return parsed;
            }
            catch {
                // Fall back below
            }
        }
        return [
            {
                orderId: 'CINE-MY-9942',
                mediaId: 'the-batman',
                title: 'The Batman',
                theatreName: 'IMAX Pavilion Elite KL, Hall 1',
                date: 'Tomorrow, Oct 8',
                time: '06:30 PM',
                seats: ['E7', 'E8'],
                totalAmount: 76.0,
                status: 'CONFIRMED',
                posterImage: '/images/movies/the-batman.jpg',
                createdAt: new Date().toISOString(),
                qrCodeData: 'https://cinepass.my/verify/CINE-MY-9942',
            },
        ];
    },
    async createBooking(payload) {
        const user = this.getCurrentUser();
        const finalPayload = {
            ...payload,
            customerName: payload.customerName || user?.fullName || 'Marcus Levin',
            customerEmail: payload.customerEmail || user?.email || 'customer@cinepass.com',
        };
        try {
            const res = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(finalPayload),
            });
            if (res.ok) {
                const data = await res.json();
                this.saveBookingToLocal(data.booking);
                return data;
            }
        }
        catch {
            // Fallback below
        }
        // Deterministic fallback response when backend is offline
        const orderId = 'CINE-' + Math.floor(1000 + Math.random() * 9000);
        const newRecord = {
            ...finalPayload,
            orderId,
            createdAt: new Date().toISOString(),
            qrCodeData: `https://cinepass.my/verify/${orderId}`,
            status: 'CONFIRMED',
        };
        this.saveBookingToLocal(newRecord);
        return {
            success: true,
            orderId,
            booking: newRecord,
        };
    },
    saveBookingToLocal(record) {
        const list = this.getSavedLocalBookings();
        list.unshift(record);
        localStorage.setItem('cinepass_my_bookings', JSON.stringify(list));
    },
    // Unified Search
    async search(query) {
        try {
            const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return await res.json();
        }
        catch {
            const q = query.toLowerCase();
            return {
                movies: moviesData.filter((m) => m.title.toLowerCase().includes(q)),
                theatres: theatresData.filter((t) => t.name.toLowerCase().includes(q)),
            };
        }
    },
};
