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
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getMovies().then((data) => {
      if (isMounted) {
        setMovies(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setMovies([]);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const heroConfig = {
    pageType: 'movies',
    statusLabelLeft: 'Tomorrow',
    statusSubLeft: 'Session schedule',
    genres: ['Action', 'Drama', 'Sci-Fi'],
    statusToggle: {
      activeOption: 'Now Showing',
      secondaryOption: 'Coming Soon',
    },
    items: movies.slice(0, 4),
  };

  return (
    <main className="w-full">
      {/* 1. PRIMARY FIGMA REFERENCE HERO SECTION (rendered only if movies exist in DB) */}
      {movies.length > 0 && (
        <HeroSection config={heroConfig} onOpenBooking={setBookingItem} />
      )}

      {/* 2. NOW SHOWING CATALOG GRID */}
      {movies.length > 0 ? (
        <NowShowingGrid
          items={movies}
          onBook={setBookingItem}
          onWatchTrailer={setTrailerItem}
          title="Now Showing in Cinemas"
          subtitle="Reserve tickets for the biggest blockbusters showing in IMAX, 3D, and Dolby Atmos."
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
