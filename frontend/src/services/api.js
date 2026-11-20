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
    name: 'IMAX Pavilion Elite KL',
    location: 'Level 8, Pavilion Kuala Lumpur, Bukit Bintang',
    addressLine: 'Level 8, Pavilion Kuala Lumpur, Bukit Bintang',
    city: 'Kuala Lumpur',
    state: 'Wilayah Persekutuan',
    distance: '1.2 km away',
    features: ['IMAX with Laser', 'Star-Max Bed Lounge', 'Dolby Atmos', 'Gourmet Bar'],
    amenities: ['IMAX Laser', 'Dolby Atmos', 'VIP Lounge', 'Recliner Luxury'],
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
    addressLine: 'Level 3, Mid Valley Megamall, Lingkaran Syed Putra',
    city: 'Kuala Lumpur',
    state: 'Wilayah Persekutuan',
    distance: '4.8 km away',
    features: ['ScreenX 270°', '4DX Motion', 'Dolby Atmos', 'Premiere Class'],
    amenities: ['ScreenX 270°', '4DX Motion', 'Dolby Atmos', 'Premiere Class'],
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
    addressLine: 'F1.M1, Sunway Pyramid Shopping Mall, Bandar Sunway',
    city: 'Petaling Jaya',
    state: 'Selangor',
    distance: '14.2 km away',
    features: ['IMAX 12-Track Sound', 'INDULGE Luxury Suites', 'Beanie Beanbag Hall'],
    amenities: ['IMAX 12-Track Sound', 'INDULGE Luxury Suites', 'Beanie Beanbag Hall'],
    showtimes: [
      { format: 'IMAX 2D', times: ['11:00 AM', '02:15 PM', '05:30 PM', '08:45 PM'], price: 36 },
      { format: 'INDULGE Luxury', times: ['01:00 PM', '04:30 PM', '07:30 PM', '10:30 PM'], price: 75 },
      { format: 'Standard 2D', times: ['10:30 AM', '01:30 PM', '04:30 PM', '07:30 PM', '10:30 PM'], price: 20 },
    ],
  },
  {
    id: 'pvr-phoenix-mumbai',
    name: 'PVR INOX Phoenix Palladium',
    location: '462, Senapati Bapat Marg, Lower Parel',
    addressLine: '462, Senapati Bapat Marg, Lower Parel',
    city: 'Mumbai',
    state: 'Maharashtra',
    distance: '2.5 km away',
    features: ['IMAX with Laser', 'Insignia Dining', 'Dolby Atmos', '4DX'],
    amenities: ['IMAX with Laser', 'Insignia Dining', 'Dolby Atmos', '4DX'],
    showtimes: [
      { format: 'IMAX Laser 2D', times: ['10:45 AM', '02:00 PM', '05:30 PM', '09:00 PM'], price: 450 },
      { format: 'Dolby Atmos', times: ['11:30 AM', '03:15 PM', '07:00 PM', '10:30 PM'], price: 320 },
    ],
  },
  {
    id: 'pvr-forum-bengaluru',
    name: 'PVR Forum Mall Koramangala',
    location: '21, Hosur Road, Koramangala',
    addressLine: '21, Hosur Road, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    distance: '3.1 km away',
    features: ['Gold Class', 'Dolby 7.1 Surround', 'IMAX Laser', 'Recliner Seating'],
    amenities: ['Gold Class', 'Dolby 7.1 Surround', 'IMAX Laser', 'Recliner Seating'],
    showtimes: [
      { format: 'IMAX Laser 2D', times: ['11:15 AM', '02:30 PM', '06:00 PM', '09:30 PM'], price: 420 },
      { format: 'Gold Class', times: ['01:00 PM', '04:45 PM', '08:15 PM'], price: 650 },
    ],
  },
  {
    id: 'pvr-select-citywalk-delhi',
    name: 'PVR Select CITYWALK Saket',
    location: 'A-3, District Centre, Saket',
    addressLine: 'A-3, District Centre, Saket',
    city: 'Delhi-NCR',
    state: 'National Capital Region',
    distance: '4.0 km away',
    features: ['IMAX Laser', 'Dolby Atmos', 'PVR Premiere', 'Director\'s Cut Lounge'],
    amenities: ['IMAX Laser', 'Dolby Atmos', 'PVR Premiere', 'Director\'s Cut Lounge'],
    showtimes: [
      { format: 'IMAX Laser 2D', times: ['11:00 AM', '02:15 PM', '05:45 PM', '09:15 PM'], price: 440 },
      { format: 'Director\'s Cut', times: ['12:30 PM', '04:00 PM', '07:30 PM', '11:00 PM'], price: 850 },
    ],
  },
  {
    id: 'shaw-theatres-singapore',
    name: 'Shaw Theatres Jewel & IMAX',
    location: 'Jewel Changi Airport, 78 Airport Blvd',
    addressLine: 'Jewel Changi Airport, 78 Airport Blvd',
    city: 'Singapore',
    state: 'Central Region',
    distance: '5.2 km away',
    features: ['IMAX with Laser', 'Lumiere Premium', 'DTS:X Sound', 'VIP Dining'],
    amenities: ['IMAX with Laser', 'Lumiere Premium', 'DTS:X Sound', 'VIP Dining'],
    showtimes: [
      { format: 'IMAX Laser 2D', times: ['11:30 AM', '02:45 PM', '06:15 PM', '09:30 PM'], price: 24 },
      { format: 'Lumiere VIP', times: ['01:15 PM', '05:00 PM', '08:45 PM'], price: 38 },
    ],
  },
  {
    id: 'gsc-gurney-plaza-penang',
    name: 'GSC Gurney Plaza Penang',
    location: 'Gurney Plaza, Persiaran Gurney, George Town',
    addressLine: 'Gurney Plaza, Persiaran Gurney, George Town',
    city: 'Penang',
    state: 'Pulau Pinang',
    distance: '2.0 km away',
    features: ['Dolby Atmos', 'Premiere Class', 'D-BOX Motion', 'GSC Play'],
    amenities: ['Dolby Atmos', 'Premiere Class', 'D-BOX Motion'],
    showtimes: [
      { format: 'Dolby Atmos', times: ['12:00 PM', '03:15 PM', '06:45 PM', '10:00 PM'], price: 24 },
      { format: 'D-BOX 2D', times: ['01:30 PM', '04:45 PM', '08:00 PM'], price: 32 },
    ],
  },
  {
    id: 'tgv-toppen-jb',
    name: 'TGV Toppen Shopping Centre',
    location: 'Toppen Shopping Centre, Taman Desa Tebrau',
    addressLine: 'Toppen Shopping Centre, Taman Desa Tebrau',
    city: 'Johor Bahru',
    state: 'Johor',
    distance: '6.4 km away',
    features: ['Flexound Augmented Audio', 'Infinity Hall', 'Prestige Lounge'],
    amenities: ['Flexound Augmented Audio', 'Infinity Hall', 'Prestige Lounge'],
    showtimes: [
      { format: 'Infinity Hall 2D', times: ['11:30 AM', '02:45 PM', '06:00 PM', '09:15 PM'], price: 22 },
      { format: 'Prestige VIP', times: ['01:00 PM', '05:00 PM', '08:30 PM'], price: 45 },
    ],
  },
  {
    id: 'prasads-imax-hyderabad',
    name: 'Prasads Multiplex & Large Screen',
    location: 'NTR Gardens, Necklace Road',
    addressLine: 'NTR Gardens, Necklace Road',
    city: 'Hyderabad',
    state: 'Telangana',
    distance: '3.5 km away',
    features: ['Giant Screen Large Format', 'Dolby Atmos', 'Gaming Zone'],
    amenities: ['Giant Screen Large Format', 'Dolby Atmos', 'Gaming Zone'],
    showtimes: [
      { format: 'Large Screen 2D', times: ['10:30 AM', '01:45 PM', '05:00 PM', '08:15 PM', '11:30 PM'], price: 350 },
      { format: 'Dolby Atmos', times: ['11:15 AM', '02:30 PM', '06:00 PM', '09:30 PM'], price: 250 },
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

export const DEFAULT_FALLBACK_STREAMS = [
  {
    id: 'house-of-the-dragon',
    indexNumber: '01',
    title: 'House of the Dragon',
    scheduleStatus: 'New Episode',
    scheduleLabel: 'Watch Now',
    heroBadge: 'Watch Now',
    badgeTopRight: 'New Episode',
    rating: 4.5,
    imdbRating: '8.4',
    trailerUrl: 'https://www.youtube.com/watch?v=DotnJ7tTA34',
    genre: 'action, fantasy, drama',
    genreTags: ['Fantasy', 'Drama', 'Action'],
    formats: ['4K HDR', 'R-18'],
    description: 'When the Targaryen dynasty is at its peak, the sibling struggle for the Iron Throne threatens to tear the kingdom apart...',
    posterImage: '/images/streams/house-of-the-dragon.jpg',
    backdropImage: '/images/backgrounds/dragon_hero.jpg',
    primaryAction: { label: 'Watch Now', icon: 'play', link: 'https://www.youtube.com/watch?v=DotnJ7tTA34' },
    secondaryAction: { label: 'More Info', link: '/streams/house-of-the-dragon' },
    statusCategory: 'now',
  },
  {
    id: 'the-last-of-us',
    indexNumber: '02',
    title: 'The Last of Us',
    scheduleStatus: 'New Episode',
    scheduleLabel: 'Watch Now',
    heroBadge: 'ORIGINAL SERIES',
    badgeTopRight: 'New Episode',
    rating: 4.9,
    imdbRating: '8.8',
    trailerUrl: 'https://www.youtube.com/watch?v=uLtkt8BonwM',
    genre: 'drama, thriller, post-apocalyptic',
    genreTags: ['Drama', 'Action', 'Sci-Fi'],
    formats: ['4K HDR', 'TV-MA'],
    description: 'After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl who may be humanity\'s last hope.',
    posterImage: '/images/streams/the-last-of-us.jpg',
    backdropImage: '/images/backgrounds/tlou_hero.jpg',
    primaryAction: { label: 'Watch Now', icon: 'play', link: 'https://www.youtube.com/watch?v=uLtkt8BonwM' },
    secondaryAction: { label: 'More Info', link: '/streams/the-last-of-us' },
    statusCategory: 'now',
  },
  {
    id: 'the-mandalorian',
    indexNumber: '03',
    title: 'The Mandalorian',
    scheduleStatus: 'Trending',
    scheduleLabel: 'Watch Now',
    heroBadge: 'STAR WARS EXCLUSIVE',
    badgeTopRight: 'Trending',
    rating: 4.7,
    imdbRating: '8.6',
    trailerUrl: 'https://www.youtube.com/watch?v=aOC8E8R_N3Y',
    genre: 'sci-fi, space western, adventure',
    genreTags: ['Sci-Fi', 'Action', 'Fantasy'],
    formats: ['4K HDR', 'TV-14'],
    description: 'The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic and Empire.',
    posterImage: '/images/streams/the-mandalorian.jpg',
    backdropImage: '/images/backgrounds/mando_hero.jpg',
    primaryAction: { label: 'Watch Now', icon: 'play', link: 'https://www.youtube.com/watch?v=aOC8E8R_N3Y' },
    secondaryAction: { label: 'More Info', link: '/streams/the-mandalorian' },
    statusCategory: 'now',
  },
  {
    id: 'stranger-things',
    indexNumber: '04',
    title: 'Stranger Things',
    scheduleStatus: 'Watch Now',
    scheduleLabel: 'Trending',
    heroBadge: 'GLOBAL HIT',
    badgeTopRight: 'Watch Now',
    rating: 4.8,
    imdbRating: '8.7',
    trailerUrl: 'https://www.youtube.com/watch?v=b9EkMc79ZSU',
    genre: 'sci-fi, horror, mystery',
    genreTags: ['Sci-Fi', 'Drama'],
    formats: ['4K HDR', 'TV-14'],
    description: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    posterImage: '/images/streams/stranger-things.jpg',
    backdropImage: '/images/backgrounds/stranger_hero.jpg',
    primaryAction: { label: 'Watch Now', icon: 'play', link: 'https://www.youtube.com/watch?v=b9EkMc79ZSU' },
    secondaryAction: { label: 'More Info', link: '/streams/stranger-things' },
    statusCategory: 'now',
  },
];

export const DEFAULT_FALLBACK_EVENTS = [
  {
    id: 'global-music-fest',
    indexNumber: '01',
    title: 'Global Music Fest',
    tagline: 'A Massive live festival experience',
    verticalTag: 'Booking Open / This Weekend',
    scheduleStatus: '10 Oct',
    scheduleLabel: 'Next Events',
    heroBadge: 'Watch Now',
    badgeTopRight: '10 Oct',
    rating: 4.5,
    genre: 'music festival, live concert, outdoor',
    genreTags: ['Music', 'Concerts', 'Festivals'],
    formats: ['LIVE HD', '18+'],
    description: 'Experience the year\'s biggest celebration of music, culture, and art featuring global headliners, spectacular laser shows, and multiple immersive stages.',
    posterImage: '/images/events/global-music-fest.jpg',
    backdropImage: '/images/backgrounds/festival_hero.jpg',
    primaryAction: { label: 'Book Now', icon: 'ticket', link: '/book/global-music-fest' },
    secondaryAction: { label: 'More Info', link: '/events/global-music-fest' },
    statusCategory: 'now',
    duration: '2 Days (Oct 10-11)',
    venue: 'Sepang International Circuit Arena',
    priceRM: 180,
    category: 'event',
  },
  {
    id: 'comedy-show',
    indexNumber: '02',
    title: 'Comedy Show',
    tagline: 'Unfiltered night of pure laughter',
    verticalTag: 'Booking Open / This Weekend',
    scheduleStatus: 'Tonight',
    scheduleLabel: 'Live Tonight',
    heroBadge: 'STANDUP LIVE',
    badgeTopRight: 'Tonight',
    rating: 4.8,
    genre: 'stand-up comedy, live, solo',
    genreTags: ['Comedy'],
    formats: ['LIVE HD', '16+'],
    description: 'Top-tier international stand-up comedians bring brand-new material, razor-sharp crowd work, and hilarious anecdotes to an intimate amphitheater setting.',
    posterImage: '/images/events/comedy-show.jpg',
    backdropImage: '/images/backgrounds/comedy_hero.jpg',
    primaryAction: { label: 'Book Now', icon: 'ticket', link: '/book/comedy-show' },
    secondaryAction: { label: 'More Info', link: '/events/comedy-show' },
    statusCategory: 'now',
    duration: '2h 15m',
    venue: 'PJ Live Arts, Petaling Jaya',
    priceRM: 85,
    category: 'event',
  },
];

export const DEFAULT_FALLBACK_SPORTS = [
  {
    id: 'f1-singapore-screening',
    indexNumber: '01',
    title: 'Formula 1 Night Race Live Screening',
    scheduleStatus: 'This Sunday',
    scheduleLabel: 'Pavilion IMAX Hall',
    heroBadge: 'LIVE IN 4K',
    badgeTopRight: 'Grand Prix',
    rating: 4.9,
    genre: 'motorsport, f1, racing',
    genreTags: ['Racing', 'Live Screening'],
    formats: ['IMAX LASER', 'DOLBY ATMOS'],
    description: 'Experience every roaring engine, hairpin turn, and pitstop drama of the Marina Bay Street Circuit on Malaysia\'s biggest IMAX screen.',
    posterImage: '/images/sports/f1-night-race.jpg',
    backdropImage: '/images/sports/sports_hero.jpg',
    primaryAction: { label: 'Book Pass', icon: 'ticket', link: '/book/f1-singapore-screening' },
    secondaryAction: { label: 'More Info', link: '/sports/f1-singapore-screening' },
    statusCategory: 'now',
    duration: '3h 30m',
    venue: 'IMAX Pavilion Elite KL',
    priceRM: 55,
    category: 'sport',
  },
  {
    id: 'premier-league-derby',
    indexNumber: '02',
    title: 'Premier League: Arsenal vs Man City',
    scheduleStatus: 'Sunday 11:30 PM',
    scheduleLabel: 'Stadium Cinema Live',
    heroBadge: 'SUPER SUNDAY',
    badgeTopRight: 'High Demand',
    rating: 4.8,
    genre: 'football, epl, premier league',
    genreTags: ['Football', 'Live Match'],
    formats: ['GIANT SCREEN', 'BEER & BITES'],
    description: 'The monumental title-deciding clash shown live with stadium atmosphere, surround sound, and passionate fan zones.',
    posterImage: '/images/sports/premier-league.jpg',
    backdropImage: '/images/sports/sports_hero.jpg',
    primaryAction: { label: 'Book Pass', icon: 'ticket', link: '/book/premier-league-derby' },
    secondaryAction: { label: 'More Info', link: '/sports/premier-league-derby' },
    statusCategory: 'now',
    duration: '2h 15m',
    venue: 'GSC Mid Valley Hall 1',
    priceRM: 40,
    category: 'sport',
  },
];

export const DEFAULT_FALLBACK_PLAYS = [
  {
    id: 'phantom-of-the-opera',
    indexNumber: '01',
    title: 'The Phantom of the Opera',
    scheduleStatus: 'Tomorrow',
    scheduleLabel: 'Istana Budaya KL',
    heroBadge: 'WEST END HIT',
    badgeTopRight: 'Selling Fast',
    rating: 4.9,
    genre: 'musical, drama, romance',
    genreTags: ['Musical', 'Drama'],
    formats: ['LIVE ORCHESTRA', 'ALL AGES'],
    description: 'Andrew Lloyd Webber\'s timeless masterpiece returns to Kuala Lumpur with an international cast and a sweeping live 40-piece orchestra.',
    posterImage: '/images/plays/phantom-opera.jpg',
    backdropImage: '/images/plays/plays_hero.jpg',
    primaryAction: { label: 'Book Seats', icon: 'ticket', link: '/book/phantom-of-the-opera' },
    secondaryAction: { label: 'More Info', link: '/plays/phantom-of-the-opera' },
    statusCategory: 'now',
    duration: '2h 30m',
    venue: 'Istana Budaya, Kuala Lumpur',
    priceRM: 180,
    category: 'play',
  },
  {
    id: 'hamilton',
    indexNumber: '02',
    title: 'Hamilton',
    scheduleStatus: 'Next Week',
    scheduleLabel: 'Plenary Hall KLCC',
    heroBadge: 'BROADWAY SENSATION',
    badgeTopRight: 'Limited Run',
    rating: 5.0,
    genre: 'hip-hop musical, history, drama',
    genreTags: ['Broadway', 'Musical'],
    formats: ['BROADWAY TOUR', '12+'],
    description: 'The story of America then, told by America now. Featuring a score that blends hip-hop, jazz, R&B, and Broadway.',
    posterImage: '/images/plays/hamilton.jpg',
    backdropImage: '/images/plays/plays_hero.jpg',
    primaryAction: { label: 'Book Seats', icon: 'ticket', link: '/book/hamilton' },
    secondaryAction: { label: 'More Info', link: '/plays/hamilton' },
    statusCategory: 'now',
    duration: '2h 45m',
    venue: 'Plenary Hall, KLCC',
    priceRM: 250,
    category: 'play',
  },
];

export const DEFAULT_FALLBACK_ACTIVITIES = [
  {
    id: 'zero-latency-vr',
    indexNumber: '01',
    title: 'Zero Latency Free-Roam VR',
    scheduleStatus: 'Open Daily',
    scheduleLabel: '1 Utama Shopping Centre',
    heroBadge: 'IMMERSIVE VR',
    badgeTopRight: 'Top Rated',
    rating: 4.9,
    genre: 'virtual reality, sci-fi, zombie survival',
    genreTags: ['VR', 'Multiplayer'],
    formats: ['WIRELESS VR', '10+'],
    description: 'Untethered, arena-scale virtual reality where you physically run, explore alien worlds, and team up with friends to survive apocalyptic hordes.',
    posterImage: '/images/activities/zero-latency-vr.jpg',
    backdropImage: '/images/activities/activities_hero.jpg',
    primaryAction: { label: 'Book Slot', icon: 'ticket', link: '/book/zero-latency-vr' },
    secondaryAction: { label: 'More Info', link: '/activities/zero-latency-vr' },
    statusCategory: 'now',
    duration: '45 mins',
    venue: '1 Utama, Petaling Jaya',
    priceRM: 89,
    category: 'activity',
  },
  {
    id: 'rud-karting-sepang',
    indexNumber: '02',
    title: 'RUD Karting Grand Prix Circuit',
    scheduleStatus: 'Open Til 2 AM',
    scheduleLabel: 'Sepang International Track',
    heroBadge: 'HIGH ADRENALINE',
    badgeTopRight: 'Night Track',
    rating: 4.8,
    genre: 'go-kart, motorsport, racing',
    genreTags: ['Racing', 'Outdoor'],
    formats: ['SODI 270CC', 'FLOODLIT'],
    description: 'Race high-speed European race karts on a floodlit FIA-standard tarmac circuit with live digital timing screens.',
    posterImage: '/images/activities/rud-karting.jpg',
    backdropImage: '/images/activities/activities_hero.jpg',
    primaryAction: { label: 'Book Session', icon: 'ticket', link: '/book/rud-karting-sepang' },
    secondaryAction: { label: 'More Info', link: '/activities/rud-karting-sepang' },
    statusCategory: 'now',
    duration: '15 mins/heat',
    venue: 'Sepang, Selangor',
    priceRM: 75,
    category: 'activity',
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
    genre: raw.genre || (rawGenres.join(', ') || 'Feature'),
    genreTags: raw.genreTags || rawGenres,
    formats: uniqueFormats,
    description: raw.description || raw.synopsis || '',
    posterImage: poster,
    backdropImage: backdrop,
    primaryAction: raw.primaryAction || {
      label: raw.hasLiveShows ? 'Book Seats' : 'Book Now',
      icon: 'ticket',
      link: raw.dbMovieId ? `/book/${raw.dbMovieId}` : `/book/${id}`,
    },
    secondaryAction: raw.secondaryAction || {
      label: 'More Info',
      link: `/movie/${id}`,
    },
    statusCategory: raw.statusCategory || 'now',
    duration: raw.duration || (raw.durationMinutes
      ? `${Math.floor(raw.durationMinutes / 60)}h ${raw.durationMinutes % 60}m`
      : ''),
    durationMinutes: raw.durationMinutes || 120,
    director: raw.director || '',
    cast: Array.isArray(raw.cast) && raw.cast.length > 0 ? raw.cast : (Array.isArray(raw.castMembers) ? raw.castMembers : []),
    castMembers: Array.isArray(raw.castMembers) ? raw.castMembers : [],
    trailerUrl: raw.trailerUrl || '',
    trailerKey: raw.trailerKey || null,
    hasLiveShows: Boolean(raw.hasLiveShows),
    dbMovieId: raw.dbMovieId || null,
    shows: Array.isArray(raw.shows) ? raw.shows : [],
    priceRM: raw.priceRM || 250,
    category: raw.category || 'movie',
    attribution: raw.attribution || 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
  };
}

export const AUTHORITATIVE_CITIES = [
  { id: 'kuala-lumpur', name: 'Kuala Lumpur', state: 'Wilayah Persekutuan', country: 'Malaysia', countryCode: 'MY', isPopular: true },
  { id: 'petaling-jaya', name: 'Petaling Jaya', state: 'Selangor', country: 'Malaysia', countryCode: 'MY', isPopular: true },
  { id: 'penang', name: 'Penang', state: 'Pulau Pinang', country: 'Malaysia', countryCode: 'MY', isPopular: true },
  { id: 'johor-bahru', name: 'Johor Bahru', state: 'Johor', country: 'Malaysia', countryCode: 'MY', isPopular: true },
  { id: 'singapore', name: 'Singapore', state: 'Central Region', country: 'Singapore', countryCode: 'SG', isPopular: true },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', country: 'India', countryCode: 'IN', isPopular: true },
  { id: 'delhi', name: 'Delhi-NCR', state: 'National Capital Region', country: 'India', countryCode: 'IN', isPopular: true },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', country: 'India', countryCode: 'IN', isPopular: true },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', country: 'India', countryCode: 'IN', isPopular: true },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', country: 'India', countryCode: 'IN', isPopular: false },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', country: 'India', countryCode: 'IN', isPopular: false },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', country: 'India', countryCode: 'IN', isPopular: false },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', country: 'India', countryCode: 'IN', isPopular: false },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', country: 'India', countryCode: 'IN', isPopular: false },
  { id: 'chandigarh', name: 'Chandigarh', state: 'Punjab', country: 'India', countryCode: 'IN', isPopular: false },
  { id: 'kochi', name: 'Kochi', state: 'Kerala', country: 'India', countryCode: 'IN', isPopular: false },
  { id: 'malacca', name: 'Malacca', state: 'Melaka', country: 'Malaysia', countryCode: 'MY', isPopular: false },
  { id: 'ipoh', name: 'Ipoh', state: 'Perak', country: 'Malaysia', countryCode: 'MY', isPopular: false },
  { id: 'kuching', name: 'Kuching', state: 'Sarawak', country: 'Malaysia', countryCode: 'MY', isPopular: false },
  { id: 'kota-kinabalu', name: 'Kota Kinabalu', state: 'Sabah', country: 'Malaysia', countryCode: 'MY', isPopular: false },
];

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

  // TMDB Endpoints
  async getNowPlaying(page = 1) {
    try {
      const res = await fetch(`${API_BASE_URL}/movies/now-playing?page=${page}`);
      if (res.ok) {
        const result = await res.json();
        const rawList = result.movies || result.data || [];
        if (rawList.length > 0) {
          return rawList.map((item, idx) => normalizeMediaItem(item, idx));
        }
      }
      return this.getMovies();
    } catch {
      return this.getMovies();
    }
  },

  async getUpcoming(page = 1) {
    try {
      const res = await fetch(`${API_BASE_URL}/movies/upcoming?page=${page}`);
      if (res.ok) {
        const result = await res.json();
        const rawList = result.movies || result.data || [];
        if (rawList.length > 0) {
          return rawList.map((item, idx) => normalizeMediaItem(item, idx));
        }
      }
      return DEFAULT_FALLBACK_MOVIES;
    } catch {
      return DEFAULT_FALLBACK_MOVIES;
    }
  },

  async getTrending(window = 'week', page = 1) {
    try {
      const res = await fetch(`${API_BASE_URL}/movies/trending?window=${window}&page=${page}`);
      if (res.ok) {
        const result = await res.json();
        const rawList = result.movies || result.data || [];
        if (rawList.length > 0) {
          return rawList.map((item, idx) => normalizeMediaItem(item, idx));
        }
      }
      return this.getMovies();
    } catch {
      return this.getMovies();
    }
  },

  async getPopular(page = 1) {
    try {
      const res = await fetch(`${API_BASE_URL}/movies/popular?page=${page}`);
      if (res.ok) {
        const result = await res.json();
        const rawList = result.movies || result.data || [];
        if (rawList.length > 0) {
          return rawList.map((item, idx) => normalizeMediaItem(item, idx));
        }
      }
      return this.getMovies();
    } catch {
      return this.getMovies();
    }
  },

  async getMovieTrailers(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/movies/${encodeURIComponent(id)}/trailers`);
      if (res.ok) {
        const result = await res.json();
        return result.trailers || [];
      }
      return [];
    } catch {
      return [];
    }
  },

  async searchMovies(query, page = 1) {
    try {
      const res = await fetch(`${API_BASE_URL}/movies/search?q=${encodeURIComponent(query)}&page=${page}`);
      if (res.ok) {
        const result = await res.json();
        const rawList = result.movies || result.data || [];
        return rawList.map((item, idx) => normalizeMediaItem(item, idx));
      }
      return [];
    } catch {
      return [];
    }
  },

  async search(query) {
    if (!query || !query.trim()) return { movies: [], theatres: [], events: [] };
    try {
      const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        return {
          movies: (data.movies || []).map((m, idx) => normalizeMediaItem(m, idx)),
          theatres: data.theatres || [],
          events: (data.events || []).map((e, idx) => normalizeMediaItem(e, idx)),
        };
      }
      return { movies: [], theatres: [], events: [] };
    } catch {
      return { movies: [], theatres: [], events: [] };
    }
  },




  // Events, Streams, Plays, Sports, Activities
  async getEvents(opts = {}) {
    try {
      let city = '';
      let category = '';
      let search = '';
      let page = '';
      let size = '';

      if (typeof opts === 'string') {
        city = opts;
      } else if (opts && typeof opts === 'object') {
        city = opts.city || '';
        category = opts.category || '';
        search = opts.search || '';
        page = opts.page || '';
        size = opts.size || '';
      }

      const params = new URLSearchParams();
      if (city) params.set('city', city);
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      if (page) params.set('page', page);
      if (size) params.set('size', size);
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/events${queryStr}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        return list;
      }
      return [];
    } catch {
      return [];
    }
  },

  async getEventById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/events/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.id || data.title)) return data;
      }
      return DEFAULT_FALLBACK_EVENTS.find(e => e.id === id) || null;
    } catch {
      return DEFAULT_FALLBACK_EVENTS.find(e => e.id === id) || null;
    }
  },

  async getStreams() {
    try {
      const res = await fetch(`${API_BASE_URL}/streams`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        if (list.length > 0) return list;
      }
      return DEFAULT_FALLBACK_STREAMS;
    } catch {
      return DEFAULT_FALLBACK_STREAMS;
    }
  },

  async getStreamById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/streams/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.id || data.title)) return data;
      }
      return DEFAULT_FALLBACK_STREAMS.find(s => s.id === id) || null;
    } catch {
      return DEFAULT_FALLBACK_STREAMS.find(s => s.id === id) || null;
    }
  },

  async getPlays() {
    try {
      const res = await fetch(`${API_BASE_URL}/plays`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        if (list.length > 0) return list;
      }
      return DEFAULT_FALLBACK_PLAYS;
    } catch {
      return DEFAULT_FALLBACK_PLAYS;
    }
  },

  async getPlayById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/plays/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.id || data.title)) return data;
      }
      return DEFAULT_FALLBACK_PLAYS.find(p => p.id === id) || null;
    } catch {
      return DEFAULT_FALLBACK_PLAYS.find(p => p.id === id) || null;
    }
  },

  async getSports() {
    try {
      const res = await fetch(`${API_BASE_URL}/sports`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        if (list.length > 0) return list;
      }
      return DEFAULT_FALLBACK_SPORTS;
    } catch {
      return DEFAULT_FALLBACK_SPORTS;
    }
  },

  async getSportById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/sports/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.id || data.title)) return data;
      }
      return DEFAULT_FALLBACK_SPORTS.find(s => s.id === id) || null;
    } catch {
      return DEFAULT_FALLBACK_SPORTS.find(s => s.id === id) || null;
    }
  },

  async getActivities() {
    try {
      const res = await fetch(`${API_BASE_URL}/activities`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        if (list.length > 0) return list;
      }
      return DEFAULT_FALLBACK_ACTIVITIES;
    } catch {
      return DEFAULT_FALLBACK_ACTIVITIES;
    }
  },

  async getActivityById(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/activities/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.id || data.title)) return data;
      }
      return DEFAULT_FALLBACK_ACTIVITIES.find(a => a.id === id) || null;
    } catch {
      return DEFAULT_FALLBACK_ACTIVITIES.find(a => a.id === id) || null;
    }
  },

  // ==================== CITIES & LOCATIONS ====================
  async getCities(params) {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.popular) query.set('popular', 'true');
      const qs = query.toString() ? `?${query.toString()}` : '';
      const res = await fetch(`${API_BASE_URL}/cities${qs}`);
      if (res.ok) {
        const body = await res.json();
        if (body.success && Array.isArray(body.data)) {
          return {
            cities: body.data,
            popular: body.popular || body.data.filter((c) => c.isPopular),
          };
        }
      }
    } catch (e) {
      console.warn('API getCities fetch error, using authoritative catalogue fallback:', e);
    }

    let list = AUTHORITATIVE_CITIES;
    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.id.includes(q)
      );
    } else if (params?.popular) {
      list = list.filter((c) => c.isPopular);
    }

    return {
      cities: list,
      popular: AUTHORITATIVE_CITIES.filter((c) => c.isPopular),
    };
  },

  async getCityById(cityId) {
    if (!cityId) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/cities/${encodeURIComponent(cityId)}`);
      if (res.ok) {
        const body = await res.json();
        if (body.success && body.data) return body.data;
      }
    } catch {
      // Fallback
    }
    const clean = String(cityId).toLowerCase().trim();
    return AUTHORITATIVE_CITIES.find(
      (c) => c.id === clean || c.name.toLowerCase() === clean
    ) || null;
  },

  async getTheatres(city) {
    try {
      const url = city && city !== 'All Cities' && city !== 'All'
        ? `${API_BASE_URL}/theatres?city=${encodeURIComponent(city)}`
        : `${API_BASE_URL}/theatres`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        if (list.length > 0) return list;
      }
    } catch (e) {
      console.warn('API getTheatres error:', e);
    }

    if (city && city !== 'All Cities' && city !== 'All') {
      const q = city.toLowerCase().trim();
      const filtered = DEFAULT_FALLBACK_THEATRES.filter(
        (t) => t.city && (t.city.toLowerCase() === q || t.city.toLowerCase().includes(q) || q.includes(t.city.toLowerCase()))
      );
      return filtered;
    }
    return DEFAULT_FALLBACK_THEATRES;
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

  getLocalBookings() {
    try {
      const raw = localStorage.getItem('tt_user_bookings');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveLocalBooking(booking) {
    try {
      if (!booking || !booking.orderId) return;
      const list = this.getLocalBookings();
      const existingIdx = list.findIndex((b) => b.orderId === booking.orderId);
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...booking };
      } else {
        list.unshift(booking);
      }
      localStorage.setItem('tt_user_bookings', JSON.stringify(list));

      // Also persist to booked seats map
      this.recordLocalSeats(
        booking.theatreName,
        booking.date,
        booking.time,
        booking.mediaId,
        booking.seats || []
      );
    } catch (e) {
      console.warn('Failed to save local booking:', e);
    }
  },

  recordLocalSeats(theatre, date, time, movieId, seats = []) {
    if (!seats || seats.length === 0) return;
    try {
      const raw = localStorage.getItem('tt_booked_seats_map');
      const map = raw ? JSON.parse(raw) : {};
      const clean = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

      const keys = [
        `${clean(theatre)}__${clean(date)}__${clean(time)}__${clean(movieId)}`,
        `${clean(theatre)}__${clean(date)}__${clean(time)}`,
        clean(theatre),
      ];

      keys.forEach((k) => {
        if (!k) return;
        const current = new Set(map[k] || []);
        seats.forEach((s) => current.add(s));
        map[k] = Array.from(current);
      });

      localStorage.setItem('tt_booked_seats_map', JSON.stringify(map));
    } catch {}
  },

  getLocalBookedSeats(theatre, date, time, movieId) {
    const found = new Set();
    const clean = (s) => String(s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cTheatre = clean(theatre);
    const cDate = clean(date);
    const cTime = clean(time);
    const cMovie = clean(movieId);

    // 1. From booked seats map
    try {
      const raw = localStorage.getItem('tt_booked_seats_map');
      if (raw) {
        const map = JSON.parse(raw);
        const specificKey = `${cTheatre}__${cDate}__${cTime}__${cMovie}`;
        const timeKey = `${cTheatre}__${cDate}__${cTime}`;
        (map[specificKey] || []).forEach((s) => found.add(s));
        (map[timeKey] || []).forEach((s) => found.add(s));
        if (!cDate && !cTime && map[cTheatre]) {
          (map[cTheatre] || []).forEach((s) => found.add(s));
        }
      }
    } catch {}

    // 2. From all local bookings
    try {
      const bookings = this.getLocalBookings();
      bookings.forEach((b) => {
        const bTheatre = clean(b.theatreName);
        const bDate = clean(b.date);
        const bTime = clean(b.time);
        const bMovie = clean(b.mediaId);

        const theatreMatches = !cTheatre || !bTheatre || bTheatre.includes(cTheatre) || cTheatre.includes(bTheatre);
        const dateMatches = !cDate || !bDate || bDate.includes(cDate) || cDate.includes(bDate);
        const timeMatches = !cTime || !bTime || bTime.includes(cTime) || cTime.includes(bTime);
        const movieMatches = !cMovie || !bMovie || bMovie === cMovie;

        if (theatreMatches && dateMatches && timeMatches && movieMatches) {
          (b.seats || []).forEach((s) => found.add(s));
        }
      });
    } catch {}

    return Array.from(found);
  },

  async recordConfirmedBooking(bookingRecord) {
    if (!bookingRecord) return;
    this.saveLocalBooking(bookingRecord);

    try {
      await fetch(`${API_BASE_URL}/bookings/confirm`, {
        method: 'POST',
        headers: this.getAuthHeaders(true),
        body: JSON.stringify({
          orderId: bookingRecord.orderId,
          seats: bookingRecord.seats,
          theatreName: bookingRecord.theatreName,
          date: bookingRecord.date,
          time: bookingRecord.time,
          mediaId: bookingRecord.mediaId,
        }),
      }).catch(() => {});
    } catch {}
  },

  async getOccupiedSeats(theatre, date, time, movieId = '') {
    const localSeats = this.getLocalBookedSeats(theatre, date, time, movieId);
    const combinedSet = new Set(['B4', 'B5', 'C6', 'C7', 'D3', 'D4', 'E4']);
    localSeats.forEach((s) => combinedSet.add(s));

    try {
      const movieParam = movieId ? `&movieId=${encodeURIComponent(movieId)}` : '';
      const url = `${API_BASE_URL}/bookings/occupied-seats?theatre=${encodeURIComponent(theatre || '')}&date=${encodeURIComponent(date || '')}&time=${encodeURIComponent(time || '')}${movieParam}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const serverSeats = data.occupiedSeats || [];
        serverSeats.forEach((s) => combinedSet.add(s));
      }
    } catch {
      // Offline fallback: keep local and default seats
    }

    return Array.from(combinedSet);
  },

  async getBookings() {
    const localBookings = this.getLocalBookings();
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) return localBookings;
      const json = await res.json();
      const serverList = Array.isArray(json) ? json : (json.data || []);

      const seen = new Set();
      const merged = [];

      [...serverList, ...localBookings].forEach((b) => {
        const id = b.orderId || b.id;
        if (id && !seen.has(id)) {
          seen.add(id);
          merged.push(b);
        }
      });

      return merged;
    } catch {
      return localBookings;
    }
  },

  async createBooking(payload) {
    const token = this.getToken();
    if (!token) {
      throw new Error('Please sign in or create an account to book tickets.');
    }
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || data.message || 'Booking creation failed');
    }

    // Persist booking and lock seats immediately into local cache
    if (data.booking) {
      this.saveLocalBooking(data.booking);
    } else if (payload && payload.seats) {
      this.recordLocalSeats(
        payload.theatreName,
        payload.date,
        payload.time,
        payload.mediaId,
        payload.seats
      );
    }

    return data;
  },

  // Unified Search with Category Context
  async search(query, category = '') {
    try {
      const catParam = category ? `&category=${encodeURIComponent(category)}` : '';
      const res = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}${catParam}`);
      if (!res.ok) return { movies: [], theatres: [], events: [], sports: [], plays: [], activities: [] };
      return await res.json();
    } catch {
      return { movies: [], theatres: [], events: [], sports: [], plays: [], activities: [] };
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
