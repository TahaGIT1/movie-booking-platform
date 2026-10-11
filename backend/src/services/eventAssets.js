/**
 * Curated, high-definition posters and cinematic backdrops for live events
 * Replaces generic/broken scraped app store buttons and dummy graphics.
 */

const BAD_IMAGE_PATTERNS = [
  '7578f6353195a792b3526f691287be4a1742904947', // Google Play / App Store download button ("wnload IT ON")
  '17916102172293',                             // Abstract purple banner ("bi...")
  'c14de0ff254f0cac2316900cbeb5ca4e1742906714', // Instagram camera icon
  'fb7a705e0ecb73494655f6a082a898be1742905087',
  '21ebc1fe6df75df6159d00e9ab651d681742906748',
];

// Specific high-res posters for known events
const SPECIFIC_EVENT_POSTERS = {
  // Chennai Events
  'in-chennai-theatre': {
    poster: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=1600&auto=format&fit=crop&q=80',
  },
  'in-chennai-alexander-babu': {
    poster: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1600&auto=format&fit=crop&q=80',
  },
  'in-chennai-standup-night': {
    poster: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
  },

  // Delhi Events
  'in-samay-raina-delhi': {
    poster: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
  },
  'in-hauz-khas-comedy': {
    poster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&auto=format&fit=crop&q=80',
  },
  'in-south-delhi-comedy': {
    poster: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&auto=format&fit=crop&q=80',
  },
  'in-zeroo-gravity-vivek': {
    poster: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
  },
  'in-diljit-delhi': {
    poster: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&auto=format&fit=crop&q=80',
  },

  // Mumbai Events
  'in-zakir-khan-mumbai': {
    poster: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
  },
  'in-arijit-mumbai': {
    poster: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1600&auto=format&fit=crop&q=80',
  },
  'in-mumbai-habitat-lineup': {
    poster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&auto=format&fit=crop&q=80',
  },
  'in-mumbai-rohan-joshi': {
    poster: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
  },
  'in-mumbai-prateek-kuhad': {
    poster: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1445985543470-41fdd6ce388d?w=1600&auto=format&fit=crop&q=80',
  },

  // Bengaluru Events
  'in-bassi-bengaluru': {
    poster: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
  },
  'in-bengaluru-kenny-sebastian': {
    poster: 'https://images.unsplash.com/photo-1543584756-8f40a802e14f?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&auto=format&fit=crop&q=80',
  },
  'in-bengaluru-kanan-biswa': {
    poster: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
  },
  'in-bengaluru-divine-gully': {
    poster: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&auto=format&fit=crop&q=80',
  },

  // Goa Events
  'in-sunburn-goa': {
    poster: 'https://images.unsplash.com/photo-1468359601543-843bfaef291a?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1600&auto=format&fit=crop&q=80',
  },
  'in-goa-sunset-comedy': {
    poster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&auto=format&fit=crop&q=80',
  },
  'in-goa-hilltop-electronic': {
    poster: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1600&auto=format&fit=crop&q=80',
  },

  // Pune Events
  'in-pune-comedy-club': {
    poster: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
  },
  'in-pune-vipul-goyal': {
    poster: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
  },
  'in-pune-nh7-weekender': {
    poster: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1600&auto=format&fit=crop&q=80',
  },

  // Hyderabad Events
  'in-hyderabad-comedy': {
    poster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&auto=format&fit=crop&q=80',
  },
  'in-hyderabad-sunidhi-chauhan': {
    poster: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1600&auto=format&fit=crop&q=80',
  },
  'in-hyderabad-vivek-samtani': {
    poster: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
  },

  // Kolkata Events
  'in-kolkata-music': {
    poster: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1600&auto=format&fit=crop&q=80',
  },
  'in-kolkata-anirban': {
    poster: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
  },

  // Belagavi Events
  'in-belagavi-showcase': {
    poster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&auto=format&fit=crop&q=80',
  },
  'in-belagavi-youth-showcase': {
    poster: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
  },
  'in-belagavi-acoustic-night': {
    poster: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    backdrop: 'https://images.unsplash.com/photo-1445985543470-41fdd6ce388d?w=1600&auto=format&fit=crop&q=80',
  },
};

// Category defaults
const CATEGORY_POSTER_POOLS = {
  comedy: [
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80',
  ],
  music: [
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&auto=format&fit=crop&q=80',
  ],
  festivals: [
    'https://images.unsplash.com/photo-1468359601543-843bfaef291a?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=crop&q=80',
  ],
  theatre: [
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&auto=format&fit=crop&q=80',
  ],
};

const CATEGORY_BACKDROPS = {
  comedy: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&auto=format&fit=crop&q=80',
  music: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&auto=format&fit=crop&q=80',
  festivals: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1600&auto=format&fit=crop&q=80',
  theatre: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=1600&auto=format&fit=crop&q=80',
};

function isBadPoster(url) {
  if (!url || typeof url !== 'string') return true;
  return BAD_IMAGE_PATTERNS.some((pat) => url.includes(pat));
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function resolveEventAssets(event) {
  const id = event.id || '';
  const title = event.title || '';
  const cat = (event.category || 'comedy').toLowerCase();

  // 1. Check direct event ID match
  if (SPECIFIC_EVENT_POSTERS[id]) {
    return {
      posterImage: SPECIFIC_EVENT_POSTERS[id].poster,
      backdropImage: SPECIFIC_EVENT_POSTERS[id].backdrop,
    };
  }

  // 2. Check title heuristics for dandiya / garba
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('dandiya') || lowerTitle.includes('garba') || lowerTitle.includes('ras')) {
    return {
      posterImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80',
      backdropImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1600&auto=format&fit=crop&q=80',
    };
  }

  // 3. Fallback if current poster is a bad image or missing
  let currentPoster = event.posterImage;
  if (isBadPoster(currentPoster)) {
    const pool = CATEGORY_POSTER_POOLS[cat] || CATEGORY_POSTER_POOLS.comedy;
    const index = hashString(title || id) % pool.length;
    currentPoster = pool[index];
  }

  let currentBackdrop = event.backdropImage;
  if (isBadPoster(currentBackdrop) || !currentBackdrop) {
    currentBackdrop = CATEGORY_BACKDROPS[cat] || CATEGORY_BACKDROPS.comedy;
  }

  return {
    posterImage: currentPoster,
    backdropImage: currentBackdrop,
  };
}
