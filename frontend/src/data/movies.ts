import type { Movie } from '../types/movie'

// Temporary UI data. Replace this module with an API service when movie endpoints are available.
export const nowShowingMovies: Movie[] = [
  { id: 'neon-skies', title: 'Neon Skies', genre: 'Sci-fi · Thriller', duration: '2h 18m', rating: 8.7, releaseLabel: 'Now showing', posterClass: 'poster-neon', posterKicker: 'A CineVerse original', posterMark: 'NEON\nSKIES' },
  { id: 'the-last-signal', title: 'The Last Signal', genre: 'Mystery · Drama', duration: '1h 54m', rating: 8.2, releaseLabel: 'Now showing', posterClass: 'poster-signal', posterKicker: 'Every secret leaves a trace', posterMark: 'THE LAST\nSIGNAL' },
  { id: 'midnight-raga', title: 'Midnight Raga', genre: 'Music · Romance', duration: '2h 06m', rating: 9.1, releaseLabel: 'Now showing', posterClass: 'poster-raga', posterKicker: 'Find your way back to the music', posterMark: 'MIDNIGHT\nRAGA' },
  { id: 'orbit-nine', title: 'Orbit Nine', genre: 'Adventure · Sci-fi', duration: '2h 22m', rating: 8.5, releaseLabel: 'Now showing', posterClass: 'poster-orbit', posterKicker: 'Beyond the edge of known', posterMark: 'ORBIT\nNINE' },
]

export const comingSoonMovies: Movie[] = [
  { id: 'paper-moons', title: 'Paper Moons', genre: 'Drama · Family', duration: '1h 48m', rating: 8.8, releaseLabel: 'Coming 18 Oct', posterClass: 'poster-moons', posterKicker: 'Some journeys are written', posterMark: 'PAPER\nMOONS' },
  { id: 'wildfire-city', title: 'Wildfire City', genre: 'Action · Crime', duration: '2h 10m', releaseLabel: 'Coming 25 Oct', posterClass: 'poster-wildfire', posterKicker: 'The city never sleeps', posterMark: 'WILDFIRE\nCITY' },
  { id: 'the-gardeners', title: 'The Gardeners', genre: 'Documentary', duration: '1h 36m', rating: 8.9, releaseLabel: 'Coming 02 Nov', posterClass: 'poster-garden', posterKicker: 'A story of roots and resilience', posterMark: 'THE\nGARDENERS' },
]
