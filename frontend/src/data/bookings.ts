import type { BookingSummary } from '../types/booking'

export type BookingStatus = 'upcoming' | 'past' | 'cancelled'

export interface MockBooking extends BookingSummary {
  reference: string
  status: BookingStatus
  total: number
}

// Temporary UI data only. These are not persisted database records.
export const mockBookings: MockBooking[] = [
  { movieId: 'neon-skies', theatreId: 'luxe-central', showtimeId: 'luxe-1915', date: '2026-10-16', seats: ['E4', 'E5'], reference: 'CV-DEMO-NEON-SKY5', status: 'upcoming', total: 640 },
  { movieId: 'midnight-raga', theatreId: 'skyline-mall', showtimeId: 'skyline-1610', date: '2026-09-21', seats: ['B4'], reference: 'CV-DEMO-MIDNIGHT-10', status: 'past', total: 240 },
  { movieId: 'orbit-nine', theatreId: 'metroplex', showtimeId: 'metro-1745', date: '2026-09-28', seats: ['C4', 'C5', 'C6'], reference: 'CV-DEMO-ORBIT-45', status: 'cancelled', total: 660 },
]
