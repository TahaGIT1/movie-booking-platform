import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BookingPayload, BookingRecord } from '../types/index.js';
import { moviesData } from '../data/movies.js';
import { eventsData } from '../data/events.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../../data/bookings.json');

const INITIAL_BOOKINGS: BookingRecord[] = [
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
    customerName: 'Marcus Levin',
    customerEmail: 'marcus@example.com',
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
    customerName: 'Marcus Levin',
    customerEmail: 'marcus@example.com',
  },
  {
    orderId: 'CINE-MY-1029',
    mediaId: 'dune',
    title: 'Dune: Part Two',
    theatreName: 'GSC Mid Valley Megamall',
    date: 'Sep 24, 2024',
    time: '09:00 PM',
    seats: ['F10', 'F11'],
    totalAmount: 72.0,
    status: 'CONFIRMED',
    posterImage: '/images/movies/dune.jpg',
    createdAt: new Date().toISOString(),
    qrCodeData: 'https://cinepass.my/verify/CINE-MY-1029',
    customerName: 'Marcus Levin',
    customerEmail: 'marcus@example.com',
  },
];

class BookingsStore {
  private cache: BookingRecord[] | null = null;

  private async ensureStorage(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      try {
        await fs.access(DATA_FILE);
      } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify(INITIAL_BOOKINGS, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('Failed to initialize bookings storage:', err);
    }
  }

  private async load(): Promise<BookingRecord[]> {
    if (this.cache) return this.cache;
    await this.ensureStorage();
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      this.cache = JSON.parse(data) as BookingRecord[];
      return this.cache;
    } catch {
      this.cache = [...INITIAL_BOOKINGS];
      return this.cache;
    }
  }

  private async persist(): Promise<void> {
    if (!this.cache) return;
    await this.ensureStorage();
    await fs.writeFile(DATA_FILE, JSON.stringify(this.cache, null, 2), 'utf-8');
  }

  public async getAll(): Promise<BookingRecord[]> {
    const list = await this.load();
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async getById(orderId: string): Promise<BookingRecord | undefined> {
    const list = await this.load();
    return list.find((b) => b.orderId.toUpperCase() === orderId.toUpperCase());
  }

  public async getOccupiedSeats(theatreName: string, date: string, time: string): Promise<string[]> {
    const list = await this.load();
    const matching = list.filter(
      (b) =>
        b.status === 'CONFIRMED' &&
        b.theatreName.toLowerCase() === theatreName.toLowerCase() &&
        b.date.toLowerCase() === date.toLowerCase() &&
        b.time.toLowerCase() === time.toLowerCase()
    );
    const set = new Set<string>();
    for (const b of matching) {
      for (const seat of b.seats) {
        set.add(seat);
      }
    }
    return Array.from(set);
  }

  public async create(payload: BookingPayload): Promise<BookingRecord> {
    const list = await this.load();
    const orderId = `CINE-MY-${Math.floor(1000 + Math.random() * 9000)}`;

    // Resolve title and poster
    const media =
      moviesData.find((m) => m.id === payload.mediaId) ||
      eventsData.find((e) => e.id === payload.mediaId);

    const record: BookingRecord = {
      ...payload,
      orderId,
      createdAt: new Date().toISOString(),
      qrCodeData: `https://cinepass.my/verify/${orderId}`,
      status: 'CONFIRMED',
      title: media?.title || payload.mediaId,
      posterImage: media?.posterImage || '/images/movies/the-batman.jpg',
    };

    list.unshift(record);
    this.cache = list;
    await this.persist();
    return record;
  }
}

export const bookingsStore = new BookingsStore();
