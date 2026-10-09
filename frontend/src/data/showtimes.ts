import type { Theatre } from '../types/showtime'

// Temporary UI data. Replace with the showtimes API when that service is available.
export const mockTheatres: Theatre[] = [
  { id: 'luxe-central', name: 'CineVerse Luxe', location: 'Indiranagar, Bengaluru', amenities: ['Dolby Atmos', 'Recliner seats'], showtimes: [{ id: 'luxe-1015', label: '10:15 AM', price: 240 }, { id: 'luxe-1345', label: '1:45 PM', price: 280 }, { id: 'luxe-1915', label: '7:15 PM', price: 320 }] },
  { id: 'skyline-mall', name: 'Skyline Cinemas', location: 'Koramangala, Bengaluru', amenities: ['IMAX', 'Food court'], showtimes: [{ id: 'skyline-1120', label: '11:20 AM', price: 210 }, { id: 'skyline-1610', label: '4:10 PM', price: 240 }, { id: 'skyline-2110', label: '9:10 PM', price: 290 }] },
  { id: 'metroplex', name: 'Metroplex PVR', location: 'Whitefield, Bengaluru', amenities: ['Parking', 'Wheelchair access'], showtimes: [{ id: 'metro-1230', label: '12:30 PM', price: 190 }, { id: 'metro-1745', label: '5:45 PM', price: 220 }] },
]
