import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Film, Calendar, Tv, Sparkles, Trophy, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { moviesData } from '../data/movies';
import { eventsData } from '../data/events';
import { streamsData } from '../data/streams';
import { playsData } from '../data/plays';
import { sportsData } from '../data/sports';
import { activitiesData } from '../data/activities';
import type { MediaItem } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const allItems: { item: MediaItem; type: 'movie' | 'event' | 'stream' | 'play' | 'sport' | 'activity' }[] = [
    ...moviesData.map((m) => ({ item: m, type: 'movie' as const })),
    ...eventsData.map((e) => ({ item: e, type: 'event' as const })),
    ...streamsData.map((s) => ({ item: s, type: 'stream' as const })),
    ...playsData.map((p) => ({ item: p, type: 'play' as const })),
    ...sportsData.map((sp) => ({ item: sp, type: 'sport' as const })),
    ...activitiesData.map((a) => ({ item: a, type: 'activity' as const })),
  ];

  const results = query.trim()
    ? allItems.filter(
        ({ item }) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.genre.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
      )
    : allItems.slice(0, 8);

  const getTargetUrl = (type: string, id: string) => {
    switch (type) {
      case 'movie':
        return `/movie/${id}`;
      case 'event':
        return `/events/${id}`;
      case 'stream':
        return `/streams/${id}`;
      case 'play':
        return `/plays/${id}`;
      case 'sport':
        return `/sports/${id}`;
      case 'activity':
        return `/activities/${id}`;
      default:
        return `/movie/${id}`;
    }
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'movie':
        return <Film className="w-3.5 h-3.5 text-[#f5a623]" />;
      case 'event':
        return <Calendar className="w-3.5 h-3.5 text-[#f5a623]" />;
      case 'stream':
        return <Tv className="w-3.5 h-3.5 text-blue-400" />;
      case 'play':
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      case 'sport':
        return <Trophy className="w-3.5 h-3.5 text-emerald-400" />;
      case 'activity':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Film className="w-3.5 h-3.5 text-[#f5a623]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#11131a] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-[#f5a623]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, concerts, broadway plays, F1, VR arenas..."
            className="w-full bg-transparent text-white placeholder-neutral-500 text-sm sm:text-base outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-xs px-2 py-1 rounded bg-white/5 border border-white/10 ml-2"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-4 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 px-2 pb-1">
            {query.trim() ? `Search Results (${results.length})` : 'Popular Recommendations'}
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs text-neutral-500 mt-1">
                Try searching for Batman, Dune, Hamilton, F1, Music Fest, or VR
              </p>
            </div>
          ) : (
            results.map(({ item, type }) => (
              <Link
                key={`${type}-${item.id}`}
                to={getTargetUrl(type, item.id)}
                onClick={onClose}
                className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
              >
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-white/10">
                  <img
                    src={item.posterImage}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-400 uppercase font-mono flex items-center gap-1">
                      {getCategoryIcon(type)}
                      {type}
                    </span>
                    <span className="text-[11px] text-[#f5a623] font-medium">★ {item.rating}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-[#f5a623] transition-colors truncate">
                    {item.title}
                  </h4>
                  <p className="text-xs text-neutral-400 truncate">
                    {item.genre} • {item.formats.join(', ')}
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
