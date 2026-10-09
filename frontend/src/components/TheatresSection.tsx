import React from 'react';
import { theatresData } from '../data/theatres';
import { MapPin, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TheatresSectionProps {
  onSelectTime?: (theatreName: string, time: string) => void;
}

export const TheatresSection: React.FC<TheatresSectionProps> = ({ onSelectTime }) => {
  return (
    <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30 mb-2 inline-block">
            VENUES & CINEMAS
          </span>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
            Popular Theatres Near You
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Browse showtimes and book your favorite cinema hall in Kuala Lumpur & Selangor.
          </p>
        </div>

        <Link
          to="/theatres"
          className="text-xs sm:text-sm font-semibold text-[#f5a623] hover:underline self-start sm:self-auto"
        >
          View All 42 Theatres →
        </Link>
      </div>

      <div className="space-y-4">
        {theatresData.slice(0, 3).map((theatre) => (
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
                    Open Now
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#f5a623]" />
                    {theatre.location}
                  </span>
                  <span className="flex items-center gap-1 text-neutral-500">
                    <Navigation className="w-3 h-3 text-neutral-400" />
                    {theatre.distance}
                  </span>
                </div>
              </div>

              {/* Hall features */}
              <div className="flex flex-wrap gap-1.5">
                {theatre.features.map((feat) => (
                  <span
                    key={feat}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 border border-white/10 text-neutral-300"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>

            {/* Showtimes row */}
            <div className="pt-4 space-y-3">
              {theatre.showtimes.map((st) => (
                <div
                  key={st.format}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white min-w-[130px]">
                      {st.format}
                    </span>
                    <span className="text-neutral-500">RM {st.price.toFixed(2)}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {st.times.map((time) => (
                      <button
                        key={time}
                        onClick={() => onSelectTime && onSelectTime(theatre.name, time)}
                        className="px-3.5 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-[#f5a623] hover:text-black hover:border-[#f5a623] text-neutral-200 font-semibold transition-all cursor-pointer"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
