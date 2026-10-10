import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Film,
  MapPin,
  ArrowRight,
  Trophy,
  Smile,
  Ticket,
  Compass,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';

function getInitialCategory(pathname) {
  if (pathname.startsWith('/sports')) return 'sports';
  if (pathname.startsWith('/plays')) return 'plays';
  if (pathname.startsWith('/events')) return 'events';
  if (pathname.startsWith('/activities')) return 'activities';
  return 'movies';
}

export const SearchModal = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('movies');
  const [results, setResults] = useState({
    movies: [],
    theatres: [],
    events: [],
    sports: [],
    plays: [],
    activities: [],
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Synchronize category with current route when opened
  useEffect(() => {
    if (isOpen) {
      const initialCat = getInitialCategory(location.pathname);
      setActiveCategory(initialCat);
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, location.pathname]);

  // Query API when query or active category changes
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);

    const delay = setTimeout(() => {
      api
        .search(query, activeCategory === 'all' ? '' : activeCategory)
        .then((data) => {
          if (isMounted) {
            setResults({
              movies: data.movies || [],
              theatres: data.theatres || [],
              events: data.events || [],
              sports: data.sports || [],
              plays: data.plays || [],
              activities: data.activities || [],
            });
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setResults({
              movies: [],
              theatres: [],
              events: [],
              sports: [],
              plays: [],
              activities: [],
            });
            setLoading(false);
          }
        });
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(delay);
    };
  }, [query, activeCategory, isOpen]);

  const categories = useMemo(
    () => [
      { id: 'all', label: 'All', icon: Layers },
      { id: 'sports', label: 'Sports', icon: Trophy, count: results.sports?.length },
      { id: 'plays', label: 'Plays & Comedy', icon: Smile, count: results.plays?.length },
      { id: 'events', label: 'Concerts & Events', icon: Ticket, count: results.events?.length },
      { id: 'movies', label: 'Movies & Shows', icon: Film, count: results.movies?.length },
      { id: 'activities', label: 'Activities', icon: Compass, count: results.activities?.length },
      { id: 'theatres', label: 'Cinemas', icon: MapPin, count: results.theatres?.length },
    ],
    [results]
  );

  const placeholderText = useMemo(() => {
    switch (activeCategory) {
      case 'sports':
        return 'Search IPL, cricket, football, sports matches...';
      case 'plays':
        return 'Search Latent Show, Samay Raina, comedy specials, plays...';
      case 'events':
        return 'Search concerts, live music festivals, arena tours...';
      case 'activities':
        return 'Search adventure parks, museums, experiential attractions...';
      case 'movies':
        return 'Search movies, new releases, cinema shows...';
      case 'theatres':
        return 'Search cinema venues and locations...';
      default:
        return 'Search sports, latent show, movies, concerts, theatres...';
    }
  }, [activeCategory]);

  const totalResultsCount =
    (results.sports?.length || 0) +
    (results.plays?.length || 0) +
    (results.events?.length || 0) +
    (results.movies?.length || 0) +
    (results.theatres?.length || 0) +
    (results.activities?.length || 0);

  const hasResults = totalResultsCount > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#11131c] border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#f5a623] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholderText}
            className="w-full bg-transparent text-white placeholder-neutral-500 text-base sm:text-lg focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-neutral-300 font-semibold ml-1 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Category Context Pills */}
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar bg-white/[0.02]">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-[#f5a623] text-black font-semibold shadow-md shadow-[#f5a623]/20'
                    : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                {cat.count !== undefined && cat.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-neutral-300'
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading && (
            <div className="text-center py-8 text-neutral-400 text-sm">
              Searching {activeCategory !== 'all' ? activeCategory : 'all categories'}...
            </div>
          )}

          {!loading && !hasResults && (
            <div className="text-center py-12">
              <Film className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No results found</p>
              <p className="text-xs text-neutral-500 mt-1">
                {query
                  ? `No items matched "${query}" in ${activeCategory}`
                  : 'Type a query or switch category tabs above'}
              </p>
            </div>
          )}

          {/* 1. Sports Section */}
          {(activeCategory === 'sports' || activeCategory === 'all') &&
            results.sports?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#f5a623] flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" />
                    Live Sports & Matches ({results.sports.length})
                  </span>
                  <Link
                    to="/sports"
                    onClick={onClose}
                    className="text-xs text-neutral-400 hover:text-[#f5a623] flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.sports.map((sport) => {
                    const isExt = sport.isExternalTicket && sport.ticketUrl;
                    const CardComponent = isExt ? 'a' : Link;
                    const linkProps = isExt
                      ? { href: sport.ticketUrl, target: '_blank', rel: 'noopener noreferrer' }
                      : { to: `/sports/${sport.id}`, onClick: onClose };

                    return (
                      <CardComponent
                        key={sport.id}
                        {...linkProps}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#f5a623]/30 transition flex items-center gap-3 group"
                      >
                        <img
                          src={
                            sport.posterImage ||
                            'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={sport.title}
                          className="w-12 h-16 object-cover rounded-lg shrink-0"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] uppercase font-bold text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded">
                              {sport.genre || 'Sports'}
                            </span>
                            {isExt && (
                              <span className="text-[9px] uppercase font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                TM Official <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#f5a623] transition-colors">
                            {sport.title}
                          </h4>
                          <p className="text-xs text-neutral-400 truncate mt-0.5">
                            {sport.venue || sport.city || 'Live Match'}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
                      </CardComponent>
                    );
                  })}
                </div>
              </div>
            )}

          {/* 2. Plays & Comedy Section */}
          {(activeCategory === 'plays' || activeCategory === 'all') &&
            results.plays?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#f5a623] flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5" />
                    Plays & Comedy Specials ({results.plays.length})
                  </span>
                  <Link
                    to="/plays"
                    onClick={onClose}
                    className="text-xs text-neutral-400 hover:text-[#f5a623] flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.plays.map((play) => {
                    const isExt = play.isExternalTicket && play.ticketUrl;
                    const CardComponent = isExt ? 'a' : Link;
                    const linkProps = isExt
                      ? { href: play.ticketUrl, target: '_blank', rel: 'noopener noreferrer' }
                      : { to: `/plays/${play.id}`, onClick: onClose };

                    return (
                      <CardComponent
                        key={play.id}
                        {...linkProps}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#f5a623]/30 transition flex items-center gap-3 group"
                      >
                        <img
                          src={
                            play.posterImage ||
                            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={play.title}
                          className="w-12 h-16 object-cover rounded-lg shrink-0"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] uppercase font-bold text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded">
                              {play.genre || 'Comedy'}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#f5a623] transition-colors">
                            {play.title}
                          </h4>
                          <p className="text-xs text-neutral-400 truncate mt-0.5">
                            {play.venue || play.city || 'Stage Performance'}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
                      </CardComponent>
                    );
                  })}
                </div>
              </div>
            )}

          {/* 3. Concerts & Live Events */}
          {(activeCategory === 'events' || activeCategory === 'all') &&
            results.events?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#f5a623] flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5" />
                    Concerts & Live Tours ({results.events.length})
                  </span>
                  <Link
                    to="/events"
                    onClick={onClose}
                    className="text-xs text-neutral-400 hover:text-[#f5a623] flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.events.map((event) => {
                    const isExt = event.isExternalTicket && event.ticketUrl;
                    const CardComponent = isExt ? 'a' : Link;
                    const linkProps = isExt
                      ? { href: event.ticketUrl, target: '_blank', rel: 'noopener noreferrer' }
                      : { to: `/events/${event.id}`, onClick: onClose };

                    return (
                      <CardComponent
                        key={event.id}
                        {...linkProps}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#f5a623]/30 transition flex items-center gap-3 group"
                      >
                        <img
                          src={
                            event.posterImage ||
                            'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={event.title}
                          className="w-12 h-16 object-cover rounded-lg shrink-0"
                          onError={(e) => {
                            e.target.src =
                              'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] uppercase font-bold text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded">
                              {event.category || 'Live Music'}
                            </span>
                            {isExt && (
                              <span className="text-[9px] uppercase font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                TM Official <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#f5a623] transition-colors">
                            {event.title}
                          </h4>
                          <p className="text-xs text-neutral-400 truncate mt-0.5">
                            {event.venue || event.city || event.date || 'Live Tour'}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
                      </CardComponent>
                    );
                  })}
                </div>
              </div>
            )}

          {/* 4. Activities Section */}
          {(activeCategory === 'activities' || activeCategory === 'all') &&
            results.activities?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#f5a623] flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    Activities & Attractions ({results.activities.length})
                  </span>
                  <Link
                    to="/activities"
                    onClick={onClose}
                    className="text-xs text-neutral-400 hover:text-[#f5a623] flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.activities.map((act) => (
                    <Link
                      key={act.id}
                      to={`/activities/${act.id}`}
                      onClick={onClose}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#f5a623]/30 transition flex items-center gap-3 group"
                    >
                      <img
                        src={
                          act.posterImage ||
                          'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=400&q=80'
                        }
                        alt={act.title}
                        className="w-12 h-16 object-cover rounded-lg shrink-0"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold text-[#f5a623] bg-[#f5a623]/10 px-1.5 py-0.5 rounded">
                          Activity
                        </span>
                        <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#f5a623] transition-colors mt-1">
                          {act.title}
                        </h4>
                        <p className="text-xs text-neutral-400 truncate mt-0.5">
                          {act.venue || act.city || 'Attraction'}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

          {/* 5. Movies Section */}
          {(activeCategory === 'movies' || activeCategory === 'all') &&
            results.movies?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" />
                    Movies & Releases ({results.movies.length})
                  </span>
                  <Link
                    to="/"
                    onClick={onClose}
                    className="text-xs text-neutral-400 hover:text-[#f5a623] flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {results.movies.map((movie) => (
                    <Link
                      key={movie.id}
                      to={`/movie/${movie.id}`}
                      onClick={onClose}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition flex items-center gap-3 group"
                    >
                      <img
                        src={
                          movie.posterImage ||
                          movie.posterUrl ||
                          '/images/movies/the-batman.jpg'
                        }
                        alt={movie.title}
                        className="w-10 h-14 object-cover rounded-lg shrink-0"
                        onError={(e) => {
                          e.target.src = '/images/movies/the-batman.jpg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#f5a623] transition-colors">
                          {movie.title}
                        </h4>
                        <p className="text-xs text-neutral-400 truncate">
                          {movie.genre ||
                            movie.description ||
                            movie.synopsis ||
                            'Featured Release'}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

          {/* 6. Theatres Section */}
          {(activeCategory === 'theatres' || activeCategory === 'all') &&
            results.theatres?.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Cinema Venues ({results.theatres.length})
                </span>
                <div className="space-y-2">
                  {results.theatres.map((theatre) => (
                    <Link
                      key={theatre.id}
                      to="/theatres"
                      onClick={onClose}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-[#f5a623]" />
                        <div>
                          <h4 className="text-sm font-semibold text-white group-hover:text-[#f5a623] transition-colors">
                            {theatre.name}
                          </h4>
                          <p className="text-xs text-neutral-400">
                            {theatre.addressLine || theatre.city || 'Cinema venue'}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
