import React, { useState, useEffect } from 'react';
import { HeroSection } from '../components/HeroSection';
import { api, DEFAULT_FALLBACK_MOVIES } from '../services/api';
import { BookingModal } from '../components/BookingModal';
import { TrailerModal } from '../components/TrailerModal';
import { NowShowingGrid } from '../components/NowShowingGrid';
import { ExperienceBanners } from '../components/ExperienceBanners';
import { TheatresSection } from '../components/TheatresSection';
import { OffersSection } from '../components/OffersSection';
import { EmptyState } from '../components/EmptyState';
import { Clapperboard } from 'lucide-react';

// High-fidelity Hero Skeleton to eliminate Layout Shift (CLS) on initial mount
const HeroSkeleton = () => (
  <div className="relative w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between overflow-hidden bg-[#0a0b0e] animate-pulse">
    <div className="relative z-10 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 pt-4 sm:pt-8 pb-4 flex-1 flex flex-col justify-between">
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center flex-1 my-auto">
        <div className="lg:col-span-6 flex flex-col justify-center max-w-2xl">
          <div className="h-4 w-32 bg-white/10 rounded-full mb-4"></div>
          <div className="h-14 sm:h-20 w-3/4 bg-white/10 rounded-2xl mb-4"></div>
          <div className="flex gap-3 mb-6">
            <div className="h-5 w-24 bg-white/10 rounded-full"></div>
            <div className="h-5 w-20 bg-white/10 rounded-full"></div>
          </div>
          <div className="h-20 w-full bg-white/5 rounded-xl mb-8"></div>
          <div className="flex gap-4">
            <div className="h-12 w-36 bg-[#f5a623]/20 rounded-xl"></div>
            <div className="h-12 w-32 bg-white/10 rounded-xl"></div>
          </div>
        </div>
        <div className="lg:col-span-6 flex items-center justify-end gap-4 overflow-hidden">
          <div className="w-48 aspect-[2/3] bg-white/5 rounded-2xl border border-white/10"></div>
          <div className="w-52 aspect-[2/3] bg-white/10 rounded-2xl border border-white/15"></div>
          <div className="w-48 aspect-[2/3] bg-white/5 rounded-2xl border border-white/10"></div>
        </div>
      </div>
    </div>
  </div>
);

const getInitialState = (key) => {
  try {
    const cached = localStorage.getItem(`tt_cached_${key}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return key === 'nowPlaying' && Array.isArray(DEFAULT_FALLBACK_MOVIES) ? DEFAULT_FALLBACK_MOVIES : [];
};

export const HomePage = () => {
  const [bookingItem, setBookingItem] = useState(null);
  const [trailerItem, setTrailerItem] = useState(null);
  const [nowPlaying, setNowPlaying] = useState(() => getInitialState('nowPlaying'));
  const [upcoming, setUpcoming] = useState(() => getInitialState('upcoming'));
  const [trending, setTrending] = useState(() => getInitialState('trending'));
  const [activeTab, setActiveTab] = useState('now');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getNowPlaying().catch(() => []),
      api.getUpcoming().catch(() => []),
      api.getTrending().catch(() => []),
    ]).then(([np, up, tr]) => {
      if (isMounted) {
        if (Array.isArray(np) && np.length > 0) {
          setNowPlaying(np);
          try { localStorage.setItem('tt_cached_nowPlaying', JSON.stringify(np)); } catch {}
        }
        if (Array.isArray(up) && up.length > 0) {
          setUpcoming(up);
          try { localStorage.setItem('tt_cached_upcoming', JSON.stringify(up)); } catch {}
        }
        if (Array.isArray(tr) && tr.length > 0) {
          setTrending(tr);
          try { localStorage.setItem('tt_cached_trending', JSON.stringify(tr)); } catch {}
        }
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const heroMovies = activeTab === 'upcoming'
    ? (upcoming.length > 0 ? upcoming : nowPlaying)
    : (nowPlaying.length > 0 ? nowPlaying : upcoming);

  const heroConfig = {
    pageType: 'movies',
    statusLabelLeft: activeTab === 'upcoming' ? 'Coming Soon' : 'Now Showing',
    statusSubLeft: activeTab === 'upcoming' ? 'Advance reservations' : 'Session schedule',
    genres: ['Action', 'Drama', 'Sci-Fi'],
    statusToggle: {
      activeOption: 'Now Showing',
      secondaryOption: 'Coming Soon',
    },
    items: heroMovies.slice(0, 8),
  };

  const gridItems = activeTab === 'upcoming'
    ? upcoming
    : activeTab === 'trending'
      ? trending
      : nowPlaying;

  const gridTitle = activeTab === 'upcoming'
    ? 'Upcoming Releases & Advance Booking'
    : activeTab === 'trending'
      ? 'Trending Movies Worldwide'
      : 'Now Showing in Cinemas';

  const gridSubtitle = activeTab === 'upcoming'
    ? 'Be the first to discover and reserve seats for the most anticipated global blockbusters.'
    : activeTab === 'trending'
      ? 'The most watched, talked-about, and highly-rated releases across the globe.'
      : 'Reserve tickets for the biggest blockbusters showing in IMAX, 3D, and Dolby Atmos.';

  return (
    <main className="w-full">
      {/* 1. PRIMARY FIGMA REFERENCE HERO SECTION */}
      {heroMovies.length > 0 ? (
        <HeroSection
          config={heroConfig}
          onOpenBooking={setBookingItem}
          currentStatusCategory={activeTab === 'upcoming' ? 'upcoming' : 'now'}
          onStatusCategoryChange={(status) => setActiveTab(status)}
        />
      ) : loading ? (
        <HeroSkeleton />
      ) : null}

      {/* 2. NOW SHOWING / COMING SOON / TRENDING CATALOG GRID */}
      {gridItems.length > 0 ? (
        <NowShowingGrid
          items={gridItems}
          onBook={setBookingItem}
          onWatchTrailer={setTrailerItem}
          title={gridTitle}
          subtitle={gridSubtitle}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
        />
      ) : loading ? (
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
          <div className="h-8 w-64 bg-white/10 rounded-xl mb-4 animate-pulse" />
          <div className="h-4 w-96 bg-white/5 rounded-lg mb-8 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
          <EmptyState
            icon={Clapperboard}
            title="No upcoming shows in Belagavi yet"
            message="New releases and now-playing titles appear here once a theatre in your area schedules them. Check back soon."
            action={{ label: 'Browse theatres', to: '/theatres' }}
          />
        </div>
      )}

      {/* 3. PREMIUM AUDITORIUM FORMATS */}
      <ExperienceBanners />

      {/* 4. THEATRES & SHOWTIMES NEAR YOU */}
      <TheatresSection
        onSelectTime={(_theatre, _time) => {
          if (nowPlaying.length > 0) {
            setBookingItem(nowPlaying[0]);
          }
        }}
      />

      {/* 5. CINEMA OFFERS & PROMOTIONS */}
      <OffersSection />

      {/* Interactive Cinema Seat Booking Modal */}
      {bookingItem && (
        <BookingModal item={bookingItem} onClose={() => setBookingItem(null)} />
      )}

      {/* Cinematic Trailer Modal */}
      {trailerItem && (
        <TrailerModal
          item={trailerItem}
          isOpen={!!trailerItem}
          onClose={() => setTrailerItem(null)}
          onOpenBooking={(item) => {
            setTrailerItem(null);
            setBookingItem(item);
          }}
        />
      )}
    </main>
  );
};
