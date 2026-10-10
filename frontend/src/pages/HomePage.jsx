import React, { useState, useEffect } from 'react';
import { HeroSection } from '../components/HeroSection';
import { moviesData } from '../data/movies';
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
    const [movies, setMovies] = useState(moviesData);
    useEffect(() => {
        let isMounted = true;
        api.getMovies().then((data) => {
            if (isMounted && data?.length > 0) {
                setMovies(data);
            }
        });
        return () => {
            isMounted = false;
        };
    }, []);
    // Hero Reference configuration
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
    return (<main className="w-full">
      {/* 1. PRIMARY FIGMA REFERENCE HERO SECTION */}
      <HeroSection config={heroConfig} onOpenBooking={setBookingItem}/>

      {/* 2. NOW SHOWING CATALOG GRID */}
      <NowShowingGrid items={movies} onBook={setBookingItem} onWatchTrailer={setTrailerItem} title="Now Showing in Cinemas" subtitle="Reserve tickets for the biggest blockbusters showing in IMAX, 3D, and Dolby Atmos."/>

      {/* 3. PREMIUM AUDITORIUM FORMATS */}
      <ExperienceBanners />

      {/* 4. THEATRES & SHOWTIMES NEAR YOU */}
      <TheatresSection onSelectTime={(_theatre, _time) => {
            setBookingItem(movies[0] || moviesData[0]);
        }}/>

      {/* 5. CINEMA OFFERS & PROMOTIONS */}
      <OffersSection />

      {/* Interactive Cinema Seat Booking Modal */}
      {bookingItem && (<BookingModal item={bookingItem} onClose={() => setBookingItem(null)}/>)}

      {/* Cinematic Trailer Modal */}
      {trailerItem && (<TrailerModal item={trailerItem} isOpen={!!trailerItem} onClose={() => setTrailerItem(null)} onOpenBooking={(item) => {
                setTrailerItem(null);
                setBookingItem(item);
            }}/>)}
    </main>);
};
