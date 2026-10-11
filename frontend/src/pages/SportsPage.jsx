import React, { useState, useEffect } from 'react';
import { HeroSection } from '../components/HeroSection';
import { api } from '../services/api';
import { BookingModal } from '../components/BookingModal';
import { EmptyState } from '../components/EmptyState';
import { CardSkeletonGrid } from '../components/CardSkeletonGrid';
import { Star, Trophy, Goal } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SportsPage = () => {
  const [bookingItem, setBookingItem] = useState(null);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getSports().then((data) => {
      if (isMounted) {
        setSports(Array.isArray(data) ? data : []);
        setFailed(false);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setSports([]);
        setFailed(true);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const heroConfig = {
    pageType: 'sports',
    verticalAccent: 'LIVE STADIUM SCREENINGS',
    statusLabelLeft: 'Grand Prix Sunday',
    statusSubLeft: '4K Laser Broadcasts with Stadium Surround',
    genres: ['All', 'Motorsport', 'Football', 'Cricket', 'Tournament'],
    statusToggle: {
      activeOption: 'Live Matches',
      secondaryOption: 'Tournament Fixtures',
    },
    items: sports.slice(0, 8),
  };

  return (
    <main className="w-full">
      {/* Hero Section */}
      {sports.length > 0 && (
        <HeroSection config={heroConfig} onOpenBooking={setBookingItem} />
      )}

      {/* Sports Catalog Grid */}
      <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="mb-8">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30 mb-2 inline-block">
            STADIUM SCREENINGS & MATCHES
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
            Live Matches & Championship Screenings
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Cheer with passionate fans on cinema screens with Dolby Atmos audio.
          </p>
        </div>

        {sports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sports.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col rounded-2xl overflow-hidden bg-[#11131c] border border-white/10 hover:border-[#f5a623]/60 transition-all duration-300 hover:-translate-y-1 shadow-xl"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                  <img
                    src={item.posterImage || '/images/movies/the-batman.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/80 backdrop-blur-md border border-white/20 text-white">
                      {item.badgeTopRight || 'Live Match'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#f5a623] font-semibold mb-1.5">
                      <Star className="w-3.5 h-3.5 fill-[#f5a623]" />
                      <span>{item.rating || '4.9'}</span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-neutral-400">{item.genre || 'Sports'}</span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-white mb-2 line-clamp-1 group-hover:text-[#f5a623] transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                        Passes From
                      </span>
                      <span className="text-sm font-bold text-white">
                        ₹{item.priceRM || 199}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/sports/${item.id}`}
                        className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 transition"
                      >
                        Info
                      </Link>
                      <button
                        onClick={() => setBookingItem(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#f5a623] hover:bg-[#d48b17] text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#f5a623]/20"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : loading ? (
          <CardSkeletonGrid count={8}/>
        ) : failed ? (
          <EmptyState
            variant="offline"
            title="Could not load sports listings"
            message="We could not reach the listings service. Check that the backend is running, then try again."
          />
        ) : (
          <EmptyState
            icon={Goal}
            title="No upcoming sports screenings in Belagavi"
            message="Live match screenings appear here once a broadcast is scheduled for a cinema near you. Check back soon."
            action={{ label: 'Browse movies instead', to: '/' }}
          />
        )}
      </section>

      {bookingItem && (
        <BookingModal item={bookingItem} onClose={() => setBookingItem(null)} />
      )}
    </main>
  );
};
