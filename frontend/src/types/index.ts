export interface MediaItem {
  id: string;
  indexNumber: string; // e.g. "01", "02", "03", "04"
  title: string;
  tagline?: string;
  scheduleStatus: string; // e.g. "Tomorrow", "10 Oct", "Tonight", "Schedule", "New Episode", "Trending"
  scheduleLabel?: string; // e.g. "Session schedule", "Next Events", "Watch Now"
  heroBadge?: string; // e.g. "BLOCKBUSTER", "Booking Open", "Online digital release"
  rating: number; // 0 to 5
  genre: string; // e.g. "action, crime, mystery"
  genreTags: string[];
  formats: string[]; // e.g. ["IMAX 2D", "PG-13"], ["LIVE HD", "18+"]
  description: string;
  posterImage: string;
  backdropImage: string;
  primaryAction: {
    label: string;
    icon?: 'ticket' | 'play';
    link: string;
  };
  secondaryAction?: {
    label: string;
    link: string;
  };
  statusCategory: 'now' | 'upcoming';
  verticalTag?: string;
  badgeTopRight?: string;
  releaseDate?: string;
  duration?: string;
  director?: string;
  cast?: string[];
  trailerUrl?: string;
  priceRM?: number;
  venue?: string;
  category?: 'movie' | 'event' | 'stream' | 'play' | 'sport' | 'activity';
}

export interface HeroConfig {
  pageType: 'movies' | 'events' | 'streams' | 'plays' | 'sports' | 'activities';
  sectionTitle?: string;
  verticalAccent?: string;
  statusLabelLeft?: string;
  statusSubLeft?: string;
  genres: string[];
  statusToggle: {
    activeOption: string;
    secondaryOption: string;
  };
  items: MediaItem[];
}

export interface Theatre {
  id: string;
  name: string;
  location: string;
  city: string;
  distance: string;
  features: string[];
  showtimes: {
    format: string;
    times: string[];
    price: number;
  }[];
}

export interface Offer {
  id: string;
  title: string;
  code: string;
  discount: string;
  description: string;
  validUntil: string;
  bannerImage: string;
  category: string;
}
