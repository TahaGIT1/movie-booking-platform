import React, { useState, useEffect } from 'react';
import { HeroSection } from '../components/HeroSection';
import { activitiesData } from '../data/activities';
import { api } from '../services/api';
import { BookingModal } from '../components/BookingModal';
import { Star, MapPin, Zap } from 'lucide-react';
export const ActivitiesPage = () => {
    const [bookingItem, setBookingItem] = useState(null);
    const [activities, setActivities] = useState(activitiesData);
    useEffect(() => {
        let isMounted = true;
        api.getActivities().then((data) => {
            if (isMounted && data?.length > 0)
                setActivities(data);
        });
        return () => {
            isMounted = false;
        };
    }, []);
    const heroConfig = {
        pageType: 'activities',
        verticalAccent: 'ADVENTURE & VR EXP',
        statusLabelLeft: 'Weekend Experiences',
        statusSubLeft: 'Arena VR, High Speed Go-Karting & Escape Mazes',
        genres: ['All', 'VR Arena', 'Motorsport', 'Escape Room', 'Theme Park'],
        statusToggle: {
            activeOption: 'Open Today',
            secondaryOption: 'Weekend Passes',
        },
        items: activities,
    };
    return (<main className="w-full">
      {/* Hero Section */}
      <HeroSection config={heroConfig} onOpenBooking={setBookingItem}/>

      {/* Activities Grid */}
      <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="mb-8">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30 mb-2 inline-block">
            WEEKEND & OUTDOOR ADVENTURE
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
            Immersive Attractions & Entertainment Zones
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Book passes for family adventures, corporate team outings, and multiplayer adrenaline rushes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activities.map((item) => (<div key={item.id} className="group flex flex-col rounded-2xl overflow-hidden bg-[#11131c] border border-white/10 hover:border-[#f5a623]/60 transition-all duration-300 hover:-translate-y-1 shadow-xl">
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                <img src={item.posterImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/80 backdrop-blur-md border border-white/20 text-white">
                    {item.badgeTopRight}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[11px] text-neutral-400">{item.genre}</span>
                    <div className="flex items-center gap-1 text-[#f5a623]">
                      <Star className="w-3.5 h-3.5 fill-[#f5a623]"/>
                      <span className="text-xs font-bold text-white">{item.rating}</span>
                    </div>
                  </div>

                  <h3 className="font-heading font-bold text-white text-base group-hover:text-[#f5a623] transition-colors line-clamp-1">
                    {item.title}
                  </h3>

                  {item.venue && (<div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#f5a623] shrink-0"/>
                      <span className="truncate">{item.venue}</span>
                    </div>)}

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.formats?.map((f) => (<span key={f} className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-neutral-300">
                        {f}
                      </span>))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#f5a623]">
                    RM {item.priceRM || 45}.00
                  </span>

                  <button onClick={() => setBookingItem(item)} className="px-3.5 py-1.5 rounded-xl bg-[#f5a623] hover:bg-[#e09612] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
                    <Zap className="w-3.5 h-3.5"/>
                    <span>Book Pass</span>
                  </button>
                </div>
              </div>
            </div>))}
        </div>
      </section>

      {bookingItem && (<BookingModal item={bookingItem} onClose={() => setBookingItem(null)}/>)}
    </main>);
};
