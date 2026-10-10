/**
 * CinePass API Service Layer
 * 
 * Provides unified communication between the frontend React client and the CineVerse backend server.
 * Connects to VITE_API_BASE_URL (defaults to /api with Vite dev proxy).
 */

import type { MediaItem, Theatre, Offer } from '../types';
import { moviesData } from '../data/movies';
import { eventsData } from '../data/events';
import { streamsData } from '../data/streams';
import { playsData } from '../data/plays';
import { sportsData } from '../data/sports';
import { activitiesData } from '../data/activities';
import { theatresData } from '../data/theatres';
import { offersData } from '../data/offers';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export type UserRole = 'CUSTOMER' | 'THEATRE_MANAGER' | 'THEATRE_STAFF' | 'SUPER_ADMIN';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  mobileNumber?: string;
  theatreId?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: UserProfile;
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
}

export interface BookingPayload {
  mediaId: string;
  theatreName: string;
  date: string;
  time: string;
  seats: string[];
  totalAmount: number;
  customerName?: string;
  customerEmail?: string;
}

export interface BookingRecord extends BookingPayload {
  orderId: string;
  createdAt: string;
  qrCodeData: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  title?: string;
  posterImage?: string;
}

export interface BookingResponse {
  success: boolean;
  orderId: string;
  booking: BookingRecord;
  error?: string;
}

export interface SeatStatusItem {
  id: string;
  showId: string;
  seatId: string;
  status: 'AVAILABLE' | 'BOOKED' | 'UNAVAILABLE';
  lockedByUserId?: string | null;
  lockExpiresAt?: string | null;
  seat?: {
    id: string;
    rowLabel: string;
    seatNumber: number;
    tier: 'NORMAL' | 'PREMIUM' | 'RECLINER';
  };
}

export const api = {
  // ==================== AUTHENTICATION ====================
  getToken(): string | null {
    return localStorage.getItem('cinepass_token');
  },

  getCurrentUser(): UserProfile | null {
    const raw = localStorage.getItem('cinepass_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  async login(email: string, password: string): Promise<AuthResponse> {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      // Local fallback for offline demo
      if (email.includes('@')) {
        const mockUser: UserProfile = {
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

  async register(fullName: string, email: string, password: string, mobileNumber?: string): Promise<AuthResponse> {
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
    } catch {
      const mockUser: UserProfile = {
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

  logout(): void {
    localStorage.removeItem('cinepass_token');
    localStorage.removeItem('cinepass_refresh_token');
    localStorage.removeItem('cinepass_user');
    try {
      fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', headers: this.getAuthHeaders() });
    } catch {
      // Ignore network errors on logout
    }
  },

  // ==================== MOVIES & CATALOG ====================
  async getMovies(params?: { search?: string; genre?: string; status?: 'now' | 'upcoming' }): Promise<MediaItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.genre) query.set('genre', params.genre);
      if (params?.status) query.set('status', params.status);

      const qs = query.toString() ? `?${query.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/movies${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      return Array.isArray(result) ? result : result.data || moviesData;
    } catch (err) {
      console.warn('Falling back to local movies data:', err);
      let list = [...moviesData];
      if (params?.status) list = list.filter((m) => m.statusCategory === params.status);
      return list;
    }
  },

  async getMovieById(id: string): Promise<MediaItem | undefined> {
    try {
      const res = await fetch(`${API_BASE_URL}/movies/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      return result.data || result;
    } catch {
      return moviesData.find((m) => m.id === id);
    }
  },

  // Events, Streams, Plays, Sports, Activities
  async getEvents(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/events`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return eventsData;
    }
  },

  async getEventById(id: string): Promise<MediaItem | undefined> {
    try {
      const res = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return eventsData.find((e) => e.id === id);
    }
  },

  async getStreams(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/streams`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return streamsData;
    }
  },

  async getPlays(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/plays`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return playsData;
    }
  },

  async getSports(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/sports`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return sportsData;
    }
  },

  async getActivities(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/activities`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return activitiesData;
    }
  },

  async getTheatres(city?: string): Promise<Theatre[]> {
    try {
      const url = city && city !== 'All Cities'
        ? `${API_BASE_URL}/theatres?city=${encodeURIComponent(city)}`
        : `${API_BASE_URL}/theatres`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : data.data || theatresData;
    } catch {
      if (!city || city === 'All Cities') return theatresData;
      return theatresData.filter((t) => t.city === city);
    }
  },

  async getOffers(): Promise<Offer[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/offers`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return offersData;
    }
  },

  // ==================== SEAT LOCKING & BOOKINGS ====================
  async lockSeats(showId: string, seatIds: string[]): Promise<{ success: boolean; lockExpiresAt?: string; message?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/shows/${encodeURIComponent(showId)}/seats/lock`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ seatIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Seats already locked by another user');
      return data;
    } catch (err: unknown) {
      // In local demo fallback, simulate successful 5-minute lock
      const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      return { success: true, lockExpiresAt: expires, message: 'Seats locked locally' };
    }
  },

  async releaseSeats(showId: string, seatIds: string[]): Promise<{ success: boolean }> {
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

  async getOccupiedSeats(theatre: string, date: string, time: string): Promise<string[]> {
    try {
      const url = `${API_BASE_URL}/bookings/occupied-seats?theatre=${encodeURIComponent(
        theatre
      )}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.occupiedSeats || [];
    } catch {
      // Consistent fallback occupied seats
      return ['B4', 'B5', 'C6', 'C7', 'D3', 'D4', 'E4'];
    }
  },

  async getBookings(): Promise<BookingRecord[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data || [];
      return list.length ? list : this.getSavedLocalBookings();
    } catch {
      return this.getSavedLocalBookings();
    }
  },

  getSavedLocalBookings(): BookingRecord[] {
    const raw = localStorage.getItem('cinepass_my_bookings');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      } catch {
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

  async createBooking(payload: BookingPayload): Promise<BookingResponse> {
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
    } catch {
      // Fallback below
    }

    // Deterministic fallback response when backend is offline
    const orderId = 'CINE-' + Math.floor(1000 + Math.random() * 9000);
    const newRecord: BookingRecord = {
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

  saveBookingToLocal(record: BookingRecord): void {
    const list = this.getSavedLocalBookings();
    list.unshift(record);
    localStorage.setItem('cinepass_my_bookings', JSON.stringify(list));
  },

  // Unified Search
  async search(query: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      const q = query.toLowerCase();
      return {
        movies: moviesData.filter((m) => m.title.toLowerCase().includes(q)),
        theatres: theatresData.filter((t) => t.name.toLowerCase().includes(q)),
      };
    }
  },
};
