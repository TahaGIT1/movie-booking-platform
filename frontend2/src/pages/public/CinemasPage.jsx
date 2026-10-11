import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Search,
  Film,
  Sparkles,
  Phone,
  Mail,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api.service';

export const CinemasPage = () => {
  const navigate = useNavigate();
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedAmenity, setSelectedAmenity] = useState('All');

  useEffect(() => {
    const fetchTheatres = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getPublicTheatres();
        if (res.success && Array.isArray(res.data)) {
          setTheatres(res.data);
        } else {
          setTheatres([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to load cinema directory');
      } finally {
        setLoading(false);
      }
    };

    fetchTheatres();
  }, []);

  // Extract unique cities
  const uniqueCities = [
    'All Cities',
    ...Array.from(new Set(theatres.map((t) => t.city).filter(Boolean)))
  ];

  // Common amenities
  const commonAmenities = [
    'All',
    'IMAX',
    'RECLINER',
    'DOLBY',
    '4DX',
    'PARKING',
    'CAFE'
  ];

  // Filtered theatres
  const filteredTheatres = theatres.filter((theatre) => {
    const matchCity =
      selectedCity === 'All Cities' ||
      theatre.city?.toLowerCase() === selectedCity.toLowerCase();

    const amenitiesList = Array.isArray(theatre.amenities)
      ? theatre.amenities
      : [];

    const matchAmenity =
      selectedAmenity === 'All' ||
      amenitiesList.some((a) =>
        String(a).toLowerCase().includes(selectedAmenity.toLowerCase())
      );

    const matchSearch =
      !searchQuery.trim() ||
      theatre.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theatre.addressLine?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theatre.city?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCity && matchAmenity && matchSearch;
  });

  return (
    <main className="w-full min-h-screen py-10 px-4 sm:px-6 lg:px-10 max-w-[1400px] mx-auto">
      {/* Header (aligned with reference design patterns) */}
      <div className="mb-8">
        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30 mb-2.5 inline-flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          CINEMA DIRECTORY & VENUES
        </span>
        <h1 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight">
          Cinema Theatres & Premium Venues
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 max-w-2xl leading-relaxed">
          Find your nearest certified cinema auditorium, explore technical sound & screen specs (IMAX Laser, Dolby Atmos, Recliner Lounges), and reserve direct showtime tickets.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#11131c] border border-white/10 mb-8 space-y-4 shadow-xl">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cinemas by venue name, mall, locality, or address..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#f5a623] transition placeholder:text-neutral-500"
          />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          {/* City Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full md:w-auto">
            <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#f5a623]" />
              City:
            </span>
            {uniqueCities.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCity(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCity === c
                    ? 'bg-[#f5a623] text-black shadow-[0_0_12px_rgba(245,166,35,0.3)]'
                    : 'bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:border-white/25'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Amenity / Feature Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full md:w-auto">
            <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-400" />
              Specs:
            </span>
            {commonAmenities.map((amenity) => (
              <button
                key={amenity}
                onClick={() => setSelectedAmenity(amenity)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedAmenity === amenity
                    ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:border-white/25'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#f5a623] animate-spin mb-3" />
          <p className="text-neutral-400 text-sm">Loading verified cinema theatres...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center max-w-md mx-auto my-12">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Failed to load cinemas</h3>
          <p className="text-xs text-neutral-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredTheatres.length === 0 && (
        <div className="bg-[#11131c] border border-white/10 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-xl">
          <Film className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
          <h3 className="text-xl font-heading font-bold text-white mb-1">No Cinemas Found</h3>
          <p className="text-xs text-neutral-400 mb-5">
            We couldn't find any theatres matching your current city or feature filters.
          </p>
          <button
            onClick={() => {
              setSelectedCity('All Cities');
              setSelectedAmenity('All');
              setSearchQuery('');
            }}
            className="px-5 py-2.5 bg-[#f5a623] hover:bg-[#e09612] text-black font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Theatres List */}
      {!loading && !error && filteredTheatres.length > 0 && (
        <div className="space-y-6">
          {filteredTheatres.map((theatre) => {
            const amenities = Array.isArray(theatre.amenities)
              ? theatre.amenities
              : [];
            const upcomingShows = Array.isArray(theatre.shows)
              ? theatre.shows
              : [];

            // Group shows by movie title
            const showsByMovie = {};
            upcomingShows.forEach((s) => {
              const movieTitle = s.movie?.title || 'Featured Film';
              if (!showsByMovie[movieTitle]) {
                showsByMovie[movieTitle] = {
                  movie: s.movie,
                  shows: []
                };
              }
              showsByMovie[movieTitle].shows.push(s);
            });

            return (
              <div
                key={theatre.id}
                className="p-6 rounded-2xl bg-[#11131c] border border-white/10 hover:border-white/20 transition-all shadow-xl"
              >
                {/* Theatre Header */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-white/10">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-xl sm:text-2xl font-heading font-bold text-white">
                        {theatre.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Verified Partner • {theatre.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#f5a623]" />
                        {theatre.addressLine}, {theatre.city}
                        {theatre.postalCode ? ` - ${theatre.postalCode}` : ''}
                      </span>

                      {theatre.contactPhone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" />
                          {theatre.contactPhone}
                        </span>
                      )}

                      {theatre.contactEmail && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-neutral-400" />
                          {theatre.contactEmail}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amenities Badges */}
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((a, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-neutral-300"
                      >
                        {a}
                      </span>
                    ))}
                    {theatre.screens && (
                      <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300">
                        {theatre.screens.length} Screens
                      </span>
                    )}
                  </div>
                </div>

                {/* Showtimes Schedule Section */}
                <div className="pt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#f5a623]" />
                      Scheduled Screenings (Click time to select seats)
                    </span>
                    <span className="text-xs text-neutral-500">
                      {upcomingShows.length} available sessions
                    </span>
                  </div>

                  {Object.keys(showsByMovie).length === 0 ? (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-neutral-400">
                      No active shows scheduled for today. Check back tomorrow or explore other cinema venues.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(showsByMovie).map(([movieTitle, group]) => {
                        return (
                          <div
                            key={movieTitle}
                            className="p-3.5 sm:p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              {group.movie?.posterUrl && (
                                <img
                                  src={group.movie.posterUrl}
                                  alt={movieTitle}
                                  className="w-10 h-14 rounded-md object-cover border border-white/10 shrink-0"
                                />
                              )}
                              <div>
                                <h4 className="text-sm font-bold text-white leading-tight">
                                  {movieTitle}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400">
                                  <span>{group.movie?.censorCertificate || 'U/A'}</span>
                                  <span>•</span>
                                  <span>{group.movie?.durationMinutes ? `${group.movie.durationMinutes} min` : 'Feature'}</span>
                                  <span>•</span>
                                  <span className="text-[#f5a623]">{group.movie?.originalLanguage || 'Hindi'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Showtimes Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                              {group.shows.map((s) => {
                                const timeStr = new Date(s.startTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                });
                                const minPrice = s.baseTierPricing
                                  ? Math.min(...Object.values(s.baseTierPricing))
                                  : 200;

                                return (
                                  <Link
                                    key={s.id}
                                    to={`/shows/${s.id}/seats`}
                                    className="px-3.5 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-[#f5a623] hover:text-black hover:border-[#f5a623] text-neutral-200 transition-all text-xs font-bold group/btn flex flex-col items-center cursor-pointer shadow"
                                    title={`Book ${s.visualFormat} (${s.languageVersion}) at ${timeStr}`}
                                  >
                                    <span>{timeStr}</span>
                                    <span className="text-[10px] text-neutral-400 group-hover/btn:text-black font-normal">
                                      ₹{minPrice} • {s.visualFormat}
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};
