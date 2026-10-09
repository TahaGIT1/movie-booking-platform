export type VerificationStatus = 'valid' | 'cancelled' | 'checked-in'

export interface MockTicketRecord {
  reference: string
  movieId: string
  theatreId: string
  showId: string
  date: string
  screen: string
  seats: string[]
  status: VerificationStatus
}

// Temporary verification fixtures only. These do not represent live ticket state.
export const mockTicketRecords: MockTicketRecord[] = [
  { reference: 'CV-DEMO-NEON-SKY5', movieId: 'neon-skies', theatreId: 'luxe-central', showId: 'luxe-1915', date: '2026-10-16', screen: 'Screen 1', seats: ['E4', 'E5'], status: 'valid' },
  { reference: 'CV-DEMO-ORBIT-45', movieId: 'orbit-nine', theatreId: 'metroplex', showId: 'metro-1745', date: '2026-09-28', screen: 'Screen 3', seats: ['C4', 'C5', 'C6'], status: 'cancelled' },
  { reference: 'CV-DEMO-MIDNIGHT-10', movieId: 'midnight-raga', theatreId: 'skyline-mall', showId: 'skyline-1610', date: '2026-09-21', screen: 'Screen 2', seats: ['B4'], status: 'checked-in' },
]
