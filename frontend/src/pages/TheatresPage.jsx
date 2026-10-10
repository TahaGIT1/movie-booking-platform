import React, { useState, useEffect } from 'react';
import { theatresData } from '../data/theatres';
import { api } from '../services/api';
import { MapPin, Navigation } from 'lucide-react';
import { BookingModal } from '../components/BookingModal';
import { moviesData } from '../data/movies';
export const TheatresPage = () => {
    const [selectedCity, setSelectedCity] = useState('All Cities');
    const [selectedFeature, setSelectedFeature] = useState('All');
    const [bookingItem, setBookingItem] = useState(null);
    const [theatres, setTheatres] = useState(theatresData);
    useEffect(() => {
        let isMounted = true;
        api.getTheatres(selectedCity).then((data) => {
            if (isMounted && data?.length > 0) {
                setTheatres(data);
            }
        });
        return () => {
            isMounted = false;
        };
    }, [selectedCity]);
    const cities = ['All Cities', 'Kuala Lumpur', 'Petaling Jaya', 'Penang', 'Johor Bahru'];
    const features = ['All', 'IMAX', 'Dolby Atmos', 'ScreenX', 'VIP Bed Lounge'];
    const filteredTheatres = theatres.filter((t) => {
        const matchCity = selectedCity === 'All Cities' || t.city === selectedCity;
        const matchFeature = selectedFeature === 'All' ||
            t.features.some((f) => f.toLowerCase().includes(selectedFeature.toLowerCase()));
        return matchCity && matchFeature;
    });
    return (<main className="w-full min-h-screen py-10 px-4 sm:px-6 lg:px-10 max-w-[1720px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30 mb-2 inline-block">
          CINEMA DIRECTORY
        </span>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight">
          Cinema Theatres & Venues in Malaysia
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
          Find your nearest cinema hall, check auditorium technical specs (IMAX with Laser, Dolby Atmos, ScreenX), and reserve showtime tickets.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-[#11131c] border border-white/10 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* City Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full md:w-auto">
          <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mr-1">
            City:
          </span>
          {cities.map((city) => (<button key={city} onClick={() => setSelectedCity(city)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${selectedCity === city
                ? 'bg-[#f5a623] text-black font-semibold'
                : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white'}`}>
              {city}
            </button>))}
        </div>

        {/* Feature Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full md:w-auto">
          <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mr-1">
            Hall:
          </span>
          {features.map((feat) => (<button key={feat} onClick={() => setSelectedFeature(feat)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${selectedFeature === feat
                ? 'bg-white text-black font-semibold'
                : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white'}`}>
              {feat}
            </button>))}
        </div>
      </div>

      {/* Theatres List */}
      <div className="space-y-6">
        {filteredTheatres.map((theatre) => (<div key={theatre.id} className="p-6 rounded-2xl bg-[#11131c] border border-white/10 hover:border-white/20 transition-all shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <h3 className="text-xl font-heading font-bold text-white">
                    {theatre.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Open • Automated Turnstiles
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#f5a623]"/>
                    {theatre.location}
                  </span>
                  <span className="flex items-center gap-1 text-neutral-400">
                    <Navigation className="w-3 h-3"/>
                    {theatre.distance}
                  </span>
                </div>
              </div>

              {/* Hall features */}
              <div className="flex flex-wrap gap-2">
                {theatre.features.map((f) => (<span key={f} className="px-3 py-1 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-neutral-300">
                    {f}
                  </span>))}
              </div>
            </div>

            {/* Daily Showtimes Matrix */}
            <div className="pt-5 space-y-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
                Available Showtimes Today (Click time to book seats)
              </span>

              {theatre.showtimes.map((st) => (<div key={st.format} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white text-sm min-w-[140px]">
                      {st.format}
                    </span>
                    <span className="text-[#f5a623] font-bold">
                      RM {st.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {st.times.map((time) => (<button key={time} onClick={() => setBookingItem(moviesData[0])} className="px-3.5 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-[#f5a623] hover:text-black hover:border-[#f5a623] text-neutral-200 font-semibold transition-all cursor-pointer">
                        {time}
                      </button>))}
                  </div>
                </div>))}
            </div>
          </div>))}
      </div>

      {bookingItem && (<BookingModal item={bookingItem} onClose={() => setBookingItem(null)}/>)}
    </main>);
};
