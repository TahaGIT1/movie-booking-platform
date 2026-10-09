export interface MockStaffShow {
  id: string
  movieId: string
  date: string
  time: string
  screen: string
  status: 'scheduled' | 'in progress' | 'completed'
}

// Temporary staff dashboard data only. Not connected to live theatre operations.
export const mockStaffShows: MockStaffShow[] = [
  { id: 'staff-neon-1', movieId: 'neon-skies', date: '2026-10-09', time: '10:15 AM', screen: 'Screen 1', status: 'completed' },
  { id: 'staff-signal-2', movieId: 'the-last-signal', date: '2026-10-09', time: '1:45 PM', screen: 'Screen 2', status: 'in progress' },
  { id: 'staff-raga-3', movieId: 'midnight-raga', date: '2026-10-09', time: '7:15 PM', screen: 'Screen 3', status: 'scheduled' },
]
