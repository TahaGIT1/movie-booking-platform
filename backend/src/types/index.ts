export interface MediaItem {
  id: string;
  indexNumber: string; // e.g. "01", "02", "03", "04"
  title: string;
  tagline?: string;
  scheduleStatus: string;
  scheduleLabel?: string;
  heroBadge?: string;
  rating: number;
  genre: string;
  genreTags: string[];
  formats: string[];
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
  posterImage?: string;
  title?: string;
}
