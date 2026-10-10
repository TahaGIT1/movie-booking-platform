import React, { useState, useEffect } from 'react';
import { HeroSection } from '../components/HeroSection';
import { eventsData } from '../data/events';
import { api } from '../services/api';
import { BookingModal } from '../components/BookingModal';
import { Star, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
export const EventsPage = () => {
    const [bookingItem, setBookingItem] = useState(null);
    const [events, setEvents] = useState(eventsData);
    useEffect(() => {
        let isMounted = true;
        api.getEvents().then((data) => {
            if (isMounted && data?.length > 0) {
                setEvents(data);
            }
        });
        return () => {
            isMounted = false;
        };
    }, []);
    // Exact Figma Hero Reference configuration
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
        items: events,
    };
    return (<main className="w-full">
      {/* 1. PRIMARY FIGMA REFERENCE HERO SECTION */}
      <HeroSection config={heroConfig} onOpenBooking={setBookingItem}/>

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
              Grab official passes for mega festivals, comedy showcases, and international art expos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((item) => (<div key={item.id} className="group flex flex-col rounded-2xl overflow-hidden bg-[#11131c] border border-white/10 hover:border-[#f5a623]/60 transition-all duration-300 hover:-translate-y-1 shadow-xl">
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                <img src={item.posterImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/80 backdrop-blur-md border border-white/20 text-white">
                    {item.badgeTopRight || item.scheduleStatus}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[11px] text-neutral-400 truncate max-w-[130px]">
                      {item.genre}
                    </span>
                    <div className="flex items-center gap-1 text-[#f5a623] font-semibold text-xs">
                      <Star className="w-3 h-3 fill-[#f5a623]"/>
                      <span>{item.rating}</span>
                    </div>
                  </div>

                  <h3 className="font-heading font-bold text-white text-base leading-snug group-hover:text-[#f5a623] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-neutral-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-500 block">
                      Passes From
                    </span>
                    <span className="text-sm font-heading font-bold text-white">
                      RM {item.priceRM || 65}.00
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => setBookingItem(item)} className="px-4 py-2 rounded-xl bg-[#f5a623] hover:bg-[#e09612] text-black font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#f5a623]/20">
                      <Ticket className="w-3.5 h-3.5"/>
                      <span>Book Pass</span>
                    </button>
                    <Link to={`/events/${item.id}`} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs" title="View Details">
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>))}
        </div>
      </section>

      {/* Interactive Booking Modal */}
      {bookingItem && (<BookingModal item={bookingItem} onClose={() => setBookingItem(null)}/>)}
    </main>);
};
