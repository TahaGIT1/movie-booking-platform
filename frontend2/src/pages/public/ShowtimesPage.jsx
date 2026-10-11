import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.service';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Film,
  ChevronRight,
  SlidersHorizontal,
  Sparkles,
  AlertCircle,
  Building2,
  CheckCircle2,
  Tag
} from 'lucide-react';

const FORMAT_OPTIONS = ['All', '2D', '3D', 'IMAX', '4DX', 'SCREEN_X'];

export const ShowtimesPage = () => {
  const { id: movieId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState('All');

  // Generate 7 upcoming dates starting today
  const dates = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isToday = i === 0;
      const isTomorrow = i === 1;
      const dayName = isToday ? 'TODAY' : isTomorrow ? 'TOMORROW' : d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
      const monthName = d.toLocaleDateString(undefined, { month: 'short' });
      const dayNum = d.getDate();
      const dateString = d.toISOString().split('T')[0];

      list.push({
        dateString,
        dayName,
        monthName,
        dayNum,
        rawDate: d
      });
    }
    return list;
  }, []);

  useEffect(() => {
    loadMovie();
  }, [movieId]);

  useEffect(() => {
    loadShows();
  }, [movieId, selectedDateIndex, selectedCity]);

  const loadMovie = async () => {
    try {
      const res = await api.getMovieById(movieId);
      const movieObj = res?.data || res;
      if (movieObj && (movieObj.id || movieObj.title)) {
        setMovie(movieObj);
      }
    } catch (err) {
      console.error('Error fetching movie:', err);
    }
  };

  const loadShows = async () => {
    setLoading(true);
    try {
      const currentDate = dates[selectedDateIndex]?.dateString;
      const showsData = await api.getPublicShows({
        movieId,
        city: selectedCity,
        date: currentDate
      });
      setShows(Array.isArray(showsData) ? showsData : []);
    } catch (err) {
      console.error('Error fetching shows:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group shows by Theatre
  const groupedTheatres = useMemo(() => {
    const map = {};
    shows.forEach((show) => {
      if (selectedFormat !== 'All' && show.visualFormat !== selectedFormat) return;
      const tId = show.theatre?.id || show.theatreId;
      if (!map[tId]) {
        map[tId] = {
          theatre: show.theatre,
          shows: []
        };
      }
      map[tId].shows.push(show);
    });

    // Sort shows within each theatre chronologically
    Object.values(map).forEach((t) => {
      t.shows.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    });

    return Object.values(map);
  }, [shows, selectedFormat]);

  // Extract unique cities from available theatres
  const availableCities = useMemo(() => {
    const set = new Set(['All Cities']);
    shows.forEach((s) => {
      if (s.theatre?.city) set.add(s.theatre.city);
    });
    return Array.from(set);
  }, [shows]);

  return (
    <div className="min-h-screen bg-[#060608] text-white pb-24 font-sans">
      {/* 1. HERO MOVIE HEADER STRIP */}
      <div className="relative border-b border-white/10 bg-[#0c0d14] overflow-hidden">
        {movie?.posterUrl && (
          <div className="absolute inset-0 opacity-15 filter blur-2xl scale-110 pointer-events-none">
            <img src={movie.posterUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#060608] via-[#060608]/90 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 py-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Movie Info */}
            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                to={`/movie/${movieId}`}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition shrink-0"
                title="Back to Movie Details"
              >
                <ArrowLeft size={18} />
              </Link>

              {movie?.posterUrl && (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-14 sm:w-16 aspect-[2/3] object-cover rounded-xl shadow-lg border border-white/10 shrink-0 hidden sm:block"
                />
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-black text-white tracking-tight">
                    {movie?.title || 'Selected Movie'}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/40">
                    {movie?.censorCertificate || 'U/A'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                  <span className="font-semibold text-neutral-200">{movie?.originalLanguage || 'Hindi'}</span>
                  <span>•</span>
                  <span>{movie?.genres?.join(', ') || 'Action, Drama'}</span>
                  <span>•</span>
                  <span>{movie?.durationMinutes ? `${movie.durationMinutes} mins` : 'Feature'}</span>
                </div>
              </div>
            </div>

            {/* City Selector */}
            <div className="flex items-center gap-2 self-start md:self-auto bg-white/5 border border-white/10 rounded-2xl px-4 py-2 shrink-0 shadow-lg">
              <MapPin size={15} className="text-[#f5a623]" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                  Select City
                </span>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2"
                >
                  {availableCities.map((c) => (
                    <option key={c} value={c} className="bg-[#171a26] text-white">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 2. HORIZONTAL 7-DAY DATE SELECTOR */}
        <div className="border-t border-white/10 bg-black/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar w-full py-1">
              {dates.map((d, index) => {
                const isSelected = selectedDateIndex === index;
                return (
                  <button
                    key={d.dateString}
                    onClick={() => setSelectedDateIndex(index)}
                    className={`flex flex-col items-center justify-center px-4 sm:px-5 py-2.5 rounded-2xl text-center min-w-[74px] sm:min-w-[82px] transition-all cursor-pointer border shrink-0 ${
                      isSelected
                        ? 'bg-[#f5a623] text-black border-[#f5a623] shadow-[0_0_20px_rgba(245,166,35,0.35)] font-black scale-105'
                        : 'bg-white/5 border-white/10 text-neutral-300 hover:border-white/25 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-extrabold tracking-wider leading-none">
                      {d.dayName}
                    </span>
                    <span className="text-lg sm:text-xl font-black leading-tight my-0.5">
                      {d.dayNum}
                    </span>
                    <span className="text-[10px] uppercase font-bold opacity-80 leading-none">
                      {d.monthName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. FORMAT FILTER STRIP */}
      <div className="max-w-7xl mx-auto px-6 pt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
            <SlidersHorizontal size={13} className="text-[#f5a623]" />
            Format:
          </span>
          {FORMAT_OPTIONS.map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedFormat === fmt
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:border-white/25'
              }`}
            >
              {fmt === 'SCREEN_X' ? 'ScreenX' : fmt}
            </button>
          ))}
        </div>

        <div className="text-xs text-neutral-400 font-medium">
          Showing showtimes for <span className="text-[#f5a623] font-bold">{dates[selectedDateIndex]?.dayName}</span> in <span className="text-white font-bold">{selectedCity}</span>
        </div>
      </div>

      {/* 4. SHOWTIMES & THEATRE VENUES LIST */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
            <div className="w-10 h-10 border-4 border-[#f5a623]/20 border-t-[#f5a623] rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Checking live cinema sessions...</p>
          </div>
        ) : groupedTheatres.length === 0 ? (
          <div className="p-16 text-center rounded-2xl bg-[#11131c] border border-white/10 max-w-lg mx-auto space-y-4 shadow-xl">
            <Clock size={48} className="text-neutral-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Showtimes Available</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              There are no screenings scheduled for this movie on {dates[selectedDateIndex]?.dayName} ({dates[selectedDateIndex]?.dateString}) in {selectedCity}.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setSelectedDateIndex(0)}
                className="px-4 py-2 bg-[#f5a623] text-black rounded-xl text-xs font-bold hover:bg-[#e09612] transition shadow cursor-pointer"
              >
                Check Today's Shows
              </button>
              <button
                onClick={() => {
                  setSelectedCity('All Cities');
                  setSelectedFormat('All');
                }}
                className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-semibold hover:bg-white/15 transition border border-white/10 cursor-pointer"
              >
                View All Cities
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedTheatres.map(({ theatre, shows }) => {
              const amenities = Array.isArray(theatre?.amenities) ? theatre.amenities : [];

              return (
                <div
                  key={theatre?.id || Math.random()}
                  className="bg-[#11131c] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl hover:border-white/20 transition-all duration-300"
                >
                  {/* Theatre Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl sm:text-2xl font-heading font-bold text-white">
                          {theatre?.name}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 size={11} />
                          Automated Turnstiles
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                        <MapPin size={13} className="text-[#f5a623]" />
                        {theatre?.addressLine ? `${theatre.addressLine}, ` : ''}{theatre?.city}
                      </p>
                    </div>

                    {/* Amenities chips */}
                    {amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {amenities.map((a, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-neutral-300"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Showtimes Grid */}
                  <div className="pt-5 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                      <Clock size={13} className="text-[#f5a623]" />
                      Available Showtimes (Click to select auditorium seats)
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {shows.map((show) => {
                        const start = new Date(show.startTime);
                        const timeStr = start.toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        });
                        const pricing = show.baseTierPricing || {};
                        const lowestPrice =
                          pricing.NORMAL || pricing.standard || Object.values(pricing)[0] || 220;

                        return (
                          <button
                            key={show.id}
                            onClick={() => navigate(`/shows/${show.id}/seats`)}
                            className="group relative p-3.5 sm:px-5 sm:py-3.5 rounded-2xl bg-white/5 hover:bg-[#f5a623] hover:text-black border border-white/15 hover:border-[#f5a623] transition-all duration-200 cursor-pointer text-left min-w-[130px] sm:min-w-[140px] shadow hover:shadow-[0_0_20px_rgba(245,166,35,0.4)]"
                          >
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-heading font-extrabold text-base text-white group-hover:text-black">
                                {timeStr}
                              </span>
                              <span className="text-xs font-black text-[#f5a623] group-hover:text-black">
                                ₹{lowestPrice}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-400 group-hover:text-black/80 font-semibold">
                              <span className="px-1.5 py-0.5 rounded bg-white/10 group-hover:bg-black/10 font-mono text-[10px]">
                                {show.visualFormat || '2D'}
                              </span>
                              <span>•</span>
                              <span className="truncate">{show.languageVersion || 'Original'}</span>
                            </div>

                            <div className="text-[10px] text-neutral-500 group-hover:text-black/60 mt-1 font-mono flex items-center justify-between">
                              <span>{show.screen?.name || 'Screen 1'}</span>
                              <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
