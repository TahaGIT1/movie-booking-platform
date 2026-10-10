import React, { useState, useEffect } from 'react';
import { HeroSection } from '../components/HeroSection';
import { api } from '../services/api';
import { BookingModal } from '../components/BookingModal';
import { Star, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EventsPage = () => {
  const [bookingItem, setBookingItem] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getEvents().then((data) => {
      if (isMounted) {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setEvents([]);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const heroConfig = {
    pageType: 'events',
    verticalAccent: 'Booking Open / This Weekend',
    statusLabelLeft: 'Booking Open',
    statusSubLeft: 'A Massive live festival experience',
    genres: ['Music', 'Comedy', 'Art', 'Concerts', 'Festivals'],
    statusToggle: {
      activeOption: 'Live Now',
      secondaryOption: 'Upcoming',
    },
    items: events.slice(0, 4),
  };

  return (
    <main className="w-full">
      {/* 1. PRIMARY FIGMA REFERENCE HERO SECTION */}
      {events.length > 0 && (
        <HeroSection config={heroConfig} onOpenBooking={setBookingItem} />
      )}

      {/* 2. SCROLLABLE LIVE EVENTS DISCOVERY GRID */}
      <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30 mb-2 inline-block">
              LIVE ARENA EXPERIENCES
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
              Trending Concerts, Comedy & Exhibitions
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Grab official passes for mega festivals, comedy showcases, and live tours in the database.
            </p>
          </div>
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((item) => (
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
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/80 backdrop-blur-md border border-white/20 text-white">
                      {item.badgeTopRight || 'Live Tour'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#f5a623] font-semibold mb-1.5">
                      <Star className="w-3.5 h-3.5 fill-[#f5a623]" />
                      <span>{item.rating || '4.5'}</span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-neutral-400">{item.genre || 'Live Event'}</span>
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
                        ₹{item.priceRM || 499}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/movie/${item.id}`}
                        className="px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 transition"
                      >
                        Info
                      </Link>
                      <button
                        onClick={() => setBookingItem(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#f5a623] hover:bg-[#d48b17] text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#f5a623]/20"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Book</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading ? (
          <div className="p-12 text-center rounded-2xl bg-[#11131c] border border-white/10">
            <div className="text-3xl mb-3">🎪</div>
            <h3 className="text-lg font-bold text-white mb-1">No Live Events Found in Database</h3>
            <p className="text-xs text-neutral-400">There are currently no concerts or live events scheduled.</p>
          </div>
        ) : null}
      </section>

      {bookingItem && (
        <BookingModal item={bookingItem} onClose={() => setBookingItem(null)} />
      )}
    </main>
  );
};
