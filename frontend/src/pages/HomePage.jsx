import React, { useState, useEffect } from 'react';
import { HeroSection } from '../components/HeroSection';
import { api } from '../services/api';
import { BookingModal } from '../components/BookingModal';
import { TrailerModal } from '../components/TrailerModal';
import { NowShowingGrid } from '../components/NowShowingGrid';
import { ExperienceBanners } from '../components/ExperienceBanners';
import { TheatresSection } from '../components/TheatresSection';
import { OffersSection } from '../components/OffersSection';

export const HomePage = () => {
  const [bookingItem, setBookingItem] = useState(null);
  const [trailerItem, setTrailerItem] = useState(null);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [trending, setTrending] = useState([]);
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
        setNowPlaying(Array.isArray(np) ? np : []);
        setUpcoming(Array.isArray(up) ? up : []);
        setTrending(Array.isArray(tr) ? tr : []);
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
    items: heroMovies.slice(0, 4),
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
      {/* 1. PRIMARY FIGMA REFERENCE HERO SECTION (rendered only if movies exist in DB/TMDB) */}
      {heroMovies.length > 0 && (
        <HeroSection
          config={heroConfig}
          onOpenBooking={setBookingItem}
          currentStatusCategory={activeTab === 'upcoming' ? 'upcoming' : 'now'}
          onStatusCategoryChange={(status) => setActiveTab(status)}
        />
      )}

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
      ) : !loading ? (

        <div className="w-full max-w-[1720px] mx-auto px-6 py-16 text-center">
          <div className="inline-flex p-4 rounded-full bg-white/5 border border-white/10 mb-4 text-3xl">🎬</div>
          <h2 className="text-xl font-bold text-white mb-2">No Movies Found in Database</h2>
          <p className="text-sm text-neutral-400">There are currently no movies scheduled in the database catalog.</p>
        </div>
      ) : null}

      {/* 3. PREMIUM AUDITORIUM FORMATS */}
      <ExperienceBanners />

      {/* 4. THEATRES & SHOWTIMES NEAR YOU */}
      <TheatresSection
        onSelectTime={(_theatre, _time) => {
          if (movies.length > 0) {
            setBookingItem(movies[0]);
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
