import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MapPin, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TheatresSection = ({ onSelectTime }) => {
  const [theatres, setTheatres] = useState([]);

  useEffect(() => {
    let isMounted = true;
    api.getTheatres().then((data) => {
      if (isMounted) {
        setTheatres(Array.isArray(data) ? data : []);
      }
    }).catch(() => {
      if (isMounted) setTheatres([]);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!theatres || theatres.length === 0) {
    return null;
  }

  return (
    <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30 mb-2 inline-block">
            VENUES & CINEMAS
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
            Popular Theatres
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Browse verified cinema halls and auditoriums.
          </p>
        </div>

        <Link
          to="/theatres"
          className="text-xs sm:text-sm font-semibold text-[#f5a623] hover:underline self-start sm:self-auto"
        >
          View All Theatres →
        </Link>
      </div>

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
    </section>
  );
};
