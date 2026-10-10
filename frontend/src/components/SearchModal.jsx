import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Film, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ movies: [], theatres: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

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

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);
    const delay = setTimeout(() => {
      api.search(query).then((data) => {
        if (isMounted) {
          setResults({
            movies: data.movies || [],
            theatres: data.theatres || [],
          });
          setLoading(false);
        }
      }).catch(() => {
        if (isMounted) {
          setResults({ movies: [], theatres: [] });
          setLoading(false);
        }
      });
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(delay);
    };
  }, [query, isOpen]);

  if (!isOpen) return null;

  const hasResults = results.movies.length > 0 || results.theatres.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#11131c] border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#f5a623] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, theatres, or events in database..."
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

        {/* Results List */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading && (
            <div className="text-center py-8 text-neutral-400 text-sm">
              Searching database...
            </div>
          )}

          {!loading && !hasResults && (
            <div className="text-center py-12">
              <Film className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No results found in database</p>
              <p className="text-xs text-neutral-500 mt-1">
                {query ? `No items matched "${query}"` : 'Type a query to search'}
              </p>
            </div>
          )}

          {/* Movies Results */}
          {results.movies.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block mb-3">
                Movies & Shows ({results.movies.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.movies.map((movie) => (
                  <Link
                    key={movie.id}
                    to={`/movie/${movie.id}`}
                    onClick={onClose}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition flex items-center gap-3 group"
                  >
                    <img
                      src={movie.posterUrl || '/images/movies/the-batman.jpg'}
                      alt={movie.title}
                      className="w-10 h-14 object-cover rounded-lg shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate group-hover:text-[#f5a623] transition-colors">
                        {movie.title}
                      </h4>
                      <p className="text-xs text-neutral-400 truncate">
                        {movie.synopsis || (movie.genres && movie.genres.join(', ')) || 'Now in Theatres'}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Theatres Results */}
          {results.theatres.length > 0 && (
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 block mb-3">
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
