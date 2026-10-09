/**
 * CinePass API Service Layer
 * 
 * Provides unified communication between the frontend React client and the backend server.
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

export const api = {
  login: async (credentials: any) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    return await res.json();
  },
  // Movies
  async getMovies(params?: { search?: string; genre?: string; status?: 'now' | 'upcoming' }): Promise<MediaItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.genre) query.set('genre', params.genre);
      if (params?.status) query.set('status', params.status);

      const qs = query.toString() ? `?${query.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/movies${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); const dbMovies = (data.data !== undefined ? data.data : data).map((m: any, i: number) => ({ id: m.id, indexNumber: (i+1).toString().padStart(2, "0"), title: m.title, genre: m.genre || "Action", genreTags: [m.genre || "Action"], formats: [m.baseFormat || "2D"], description: m.description, posterImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", backdropImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", primaryAction: { label: "Book Tickets", link: `/movies/${m.id}` }, scheduleStatus: "Now Showing", rating: 4.5, statusCategory: "now" })); return [...dbMovies, ...moviesData.slice(dbMovies.length)];
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
      const data = await res.json(); const dbMovies = (data.data !== undefined ? data.data : data).map((m: any, i: number) => ({ id: m.id, indexNumber: (i+1).toString().padStart(2, "0"), title: m.title, genre: m.genre || "Action", genreTags: [m.genre || "Action"], formats: [m.baseFormat || "2D"], description: m.description, posterImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", backdropImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", primaryAction: { label: "Book Tickets", link: `/movies/${m.id}` }, scheduleStatus: "Now Showing", rating: 4.5, statusCategory: "now" })); return [...dbMovies, ...moviesData.slice(dbMovies.length)];
    } catch {
      return moviesData.find((m) => m.id === id);
    }
  },

  // Events
  async getEvents(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/events`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); const dbMovies = (data.data !== undefined ? data.data : data).map((m: any, i: number) => ({ id: m.id, indexNumber: (i+1).toString().padStart(2, "0"), title: m.title, genre: m.genre || "Action", genreTags: [m.genre || "Action"], formats: [m.baseFormat || "2D"], description: m.description, posterImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", backdropImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", primaryAction: { label: "Book Tickets", link: `/movies/${m.id}` }, scheduleStatus: "Now Showing", rating: 4.5, statusCategory: "now" })); return [...dbMovies, ...moviesData.slice(dbMovies.length)];
    } catch {
      return eventsData;
    }
  },

  async getEventById(id: string): Promise<MediaItem | undefined> {
    try {
      const res = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); const dbMovies = (data.data !== undefined ? data.data : data).map((m: any, i: number) => ({ id: m.id, indexNumber: (i+1).toString().padStart(2, "0"), title: m.title, genre: m.genre || "Action", genreTags: [m.genre || "Action"], formats: [m.baseFormat || "2D"], description: m.description, posterImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", backdropImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", primaryAction: { label: "Book Tickets", link: `/movies/${m.id}` }, scheduleStatus: "Now Showing", rating: 4.5, statusCategory: "now" })); return [...dbMovies, ...moviesData.slice(dbMovies.length)];
    } catch {
      return eventsData.find((e) => e.id === id);
    }
  },

  // Streams
  async getStreams(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/streams`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); const dbMovies = (data.data !== undefined ? data.data : data).map((m: any, i: number) => ({ id: m.id, indexNumber: (i+1).toString().padStart(2, "0"), title: m.title, genre: m.genre || "Action", genreTags: [m.genre || "Action"], formats: [m.baseFormat || "2D"], description: m.description, posterImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", backdropImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", primaryAction: { label: "Book Tickets", link: `/movies/${m.id}` }, scheduleStatus: "Now Showing", rating: 4.5, statusCategory: "now" })); return [...dbMovies, ...moviesData.slice(dbMovies.length)];
    } catch {
      return streamsData;
    }
  },

  // Plays
  async getPlays(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/plays`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); const dbMovies = (data.data !== undefined ? data.data : data).map((m: any, i: number) => ({ id: m.id, indexNumber: (i+1).toString().padStart(2, "0"), title: m.title, genre: m.genre || "Action", genreTags: [m.genre || "Action"], formats: [m.baseFormat || "2D"], description: m.description, posterImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", backdropImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", primaryAction: { label: "Book Tickets", link: `/movies/${m.id}` }, scheduleStatus: "Now Showing", rating: 4.5, statusCategory: "now" })); return [...dbMovies, ...moviesData.slice(dbMovies.length)];
    } catch {
      return playsData;
    }
  },

  // Sports
  async getSports(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/sports`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); const dbMovies = (data.data !== undefined ? data.data : data).map((m: any, i: number) => ({ id: m.id, indexNumber: (i+1).toString().padStart(2, "0"), title: m.title, genre: m.genre || "Action", genreTags: [m.genre || "Action"], formats: [m.baseFormat || "2D"], description: m.description, posterImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", backdropImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", primaryAction: { label: "Book Tickets", link: `/movies/${m.id}` }, scheduleStatus: "Now Showing", rating: 4.5, statusCategory: "now" })); return [...dbMovies, ...moviesData.slice(dbMovies.length)];
    } catch {
      return sportsData;
    }
  },

  // Activities
  async getActivities(): Promise<MediaItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/activities`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); const dbMovies = (data.data !== undefined ? data.data : data).map((m: any, i: number) => ({ id: m.id, indexNumber: (i+1).toString().padStart(2, "0"), title: m.title, genre: m.genre || "Action", genreTags: [m.genre || "Action"], formats: [m.baseFormat || "2D"], description: m.description, posterImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", backdropImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", primaryAction: { label: "Book Tickets", link: `/movies/${m.id}` }, scheduleStatus: "Now Showing", rating: 4.5, statusCategory: "now" })); return [...dbMovies, ...moviesData.slice(dbMovies.length)];
    } catch {
      return activitiesData;
    }
  },

  // Theatres
  async getTheatres(city?: string): Promise<Theatre[]> {
    try {
      const url = city && city !== 'All Cities'
        ? `${API_BASE_URL}/theatres?city=${encodeURIComponent(city)}`
        : `${API_BASE_URL}/theatres`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); const dbMovies = (data.data !== undefined ? data.data : data).map((m: any, i: number) => ({ id: m.id, indexNumber: (i+1).toString().padStart(2, "0"), title: m.title, genre: m.genre || "Action", genreTags: [m.genre || "Action"], formats: [m.baseFormat || "2D"], description: m.description, posterImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", backdropImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", primaryAction: { label: "Book Tickets", link: `/movies/${m.id}` }, scheduleStatus: "Now Showing", rating: 4.5, statusCategory: "now" })); return [...dbMovies, ...moviesData.slice(dbMovies.length)];
    } catch {
      if (!city || city === 'All Cities') return theatresData;
      return theatresData.filter((t) => t.city === city);
    }
  },

  // Offers
  async getOffers(): Promise<Offer[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/offers`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); const dbMovies = (data.data !== undefined ? data.data : data).map((m: any, i: number) => ({ id: m.id, indexNumber: (i+1).toString().padStart(2, "0"), title: m.title, genre: m.genre || "Action", genreTags: [m.genre || "Action"], formats: [m.baseFormat || "2D"], description: m.description, posterImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", backdropImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", primaryAction: { label: "Book Tickets", link: `/movies/${m.id}` }, scheduleStatus: "Now Showing", rating: 4.5, statusCategory: "now" })); return [...dbMovies, ...moviesData.slice(dbMovies.length)];
    } catch {
      return offersData;
    }
  },

  // Bookings
  async getBookings(): Promise<BookingRecord[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); const dbMovies = (data.data !== undefined ? data.data : data).map((m: any, i: number) => ({ id: m.id, indexNumber: (i+1).toString().padStart(2, "0"), title: m.title, genre: m.genre || "Action", genreTags: [m.genre || "Action"], formats: [m.baseFormat || "2D"], description: m.description, posterImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", backdropImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", primaryAction: { label: "Book Tickets", link: `/movies/${m.id}` }, scheduleStatus: "Now Showing", rating: 4.5, statusCategory: "now" })); return [...dbMovies, ...moviesData.slice(dbMovies.length)];
    } catch (err) {
      console.warn('Falling back to local initial bookings:', err);
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
        {
          orderId: 'CINE-EV-4410',
          mediaId: 'global-music-fest',
          title: 'Global Music Fest',
          theatreName: 'Axiata Arena Bukit Jalil',
          date: 'Friday, Oct 10',
          time: '07:00 PM',
          seats: ['VIP-12', 'VIP-13'],
          totalAmount: 380.0,
          status: 'CONFIRMED',
          posterImage: '/images/events/global-music-fest.jpg',
          createdAt: new Date().toISOString(),
          qrCodeData: 'https://cinepass.my/verify/CINE-EV-4410',
        },
      ];
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
      return ['B4', 'B5', 'C6', 'C7', 'D3', 'D4', 'E4'];
    }
  },

  async createBooking(payload: BookingPayload): Promise<BookingResponse> {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to complete booking');
    }
    return data;
  },

  // Unified Search
  async search(query: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); const dbMovies = (data.data !== undefined ? data.data : data).map((m: any, i: number) => ({ id: m.id, indexNumber: (i+1).toString().padStart(2, "0"), title: m.title, genre: m.genre || "Action", genreTags: [m.genre || "Action"], formats: [m.baseFormat || "2D"], description: m.description, posterImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", backdropImage: m.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1", primaryAction: { label: "Book Tickets", link: `/movies/${m.id}` }, scheduleStatus: "Now Showing", rating: 4.5, statusCategory: "now" })); return [...dbMovies, ...moviesData.slice(dbMovies.length)];
    } catch {
      return null;
    }
  },
};


