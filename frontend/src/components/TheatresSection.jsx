import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MapPin, Navigation, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocationContext } from '../contexts/LocationContext';

export const TheatresSection = ({ onSelectTime }) => {
  const { selectedCity, openLocationModal, isInitialized } = useLocationContext();
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isInitialized) return;
    let isMounted = true;
    setLoading(true);
    api.getTheatres(selectedCity?.name).then((data) => {
      if (isMounted) {
        setTheatres(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setTheatres([]);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedCity, isInitialized]);

  return (
    <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30 mb-2 inline-block">
            VENUES & CINEMAS
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
            {selectedCity ? `Popular Theatres in ${selectedCity.name}` : 'Popular Theatres'}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {selectedCity
              ? `Browse verified cinema halls and auditoriums in ${selectedCity.name}.`
              : 'Choose your city to explore nearby cinema halls and auditoriums.'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={openLocationModal}
            className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 bg-white/5 transition-all cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-[#f5a623]" />
            <span className="font-medium">{selectedCity ? selectedCity.name : 'Select City'}</span>
            <span className="text-[10px] text-[#f5a623] ml-1">Change</span>
          </button>

          <Link
            to="/theatres"
            className="text-xs sm:text-sm font-semibold text-[#f5a623] hover:underline whitespace-nowrap"
          >
            View All Theatres →
          </Link>
        </div>
      </div>

      {theatres.length > 0 ? (
        <div className="space-y-4">
          {theatres.slice(0, 3).map((theatre) => {
            const amenities = theatre.amenities || theatre.features || [];
            return (
              <div
                key={theatre.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#11131c] border border-white/10 hover:border-white/20 transition-all shadow-xl"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-heading font-bold text-white">
                        {theatre.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {theatre.status || 'Active'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#f5a623]" />
                        {theatre.addressLine || theatre.location || theatre.city || 'Cinema venue'}
                      </span>
                      {theatre.contactPhone && (
                        <span className="flex items-center gap-1 text-neutral-500">
                          <Navigation className="w-3 h-3 text-neutral-400" />
                          {theatre.contactPhone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hall features */}
                  {amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {amenities.map((feat) => (
                        <span
                          key={feat}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 border border-white/10 text-neutral-300"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Screens summary */}
                {theatre.screens && theatre.screens.length > 0 && (
                  <div className="pt-4 flex flex-wrap gap-2 text-xs">
                    {theatre.screens.map((screen) => (
                      <div
                        key={screen.id}
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-300"
                      >
                        <span className="font-semibold text-white mr-2">{screen.name}</span>
                        <span className="text-[#f5a623]">{screen.totalCapacity} seats</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : loading ? (
        <div className="p-8 rounded-2xl bg-[#11131c] border border-white/10 text-center animate-pulse">
          <p className="text-xs text-neutral-400">Loading cinema listings for {selectedCity ? selectedCity.name : 'your area'}...</p>
        </div>
      ) : (
        <div className="p-8 sm:p-12 rounded-2xl bg-[#11131c] border border-white/10 text-center">
          <MapPin className="w-8 h-8 text-[#f5a623] mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-bold text-white mb-1">
            {selectedCity ? `No cinemas listed in ${selectedCity.name} yet` : 'Select your city to see nearby cinemas'}
          </h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto mb-4">
            {selectedCity
              ? `We are expanding rapidly! Try choosing another city or browse our all-venues directory.`
              : 'Choose a city to explore local auditoriums, premium IMAX laser screens, and live showtimes.'}
          </p>
          <button
            onClick={openLocationModal}
            className="px-5 py-2.5 rounded-xl bg-[#f5a623] hover:bg-[#e09612] text-black text-xs font-bold transition-all cursor-pointer shadow-lg shadow-[#f5a623]/20"
          >
            {selectedCity ? 'Choose Another City' : 'Choose Your City'}
          </button>
        </div>
      )}
    </section>
  );
};
