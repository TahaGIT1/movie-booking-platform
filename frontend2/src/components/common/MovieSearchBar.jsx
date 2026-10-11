import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  X,
  Film,
  Star,
  Clock,
  Globe,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { api } from '../../services/api.service';

const GENRES = [
  'All',
  'Action',
  'Drama',
  'Comedy',
  'Sci-Fi',
  'Thriller',
  'Crime',
  'Romance',
  'Horror',
  'Adventure',
  'Animation'
];

const LANGUAGES = [
  'All',
  'Hindi',
  'Kannada',
  'Telugu',
  'Tamil',
  'Malayalam',
  'English'
];

const CERTIFICATES = [
  'All',
  'U',
  'U/A',
  'A'
];

export const MovieSearchBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);

  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');

  const [allMovies, setAllMovies] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch initial movie list for instant client-side searching
  useEffect(() => {
    api.getMovies()
      .then((data) => {
        if (Array.isArray(data)) setAllMovies(data);
      })
      .catch(() => {});
  }, []);

  // Sync state from URL query parameters if on homepage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qParam = params.get('q');
    const genreParam = params.get('genre');
    const langParam = params.get('lang');
    const certParam = params.get('cert');

    if (qParam !== null) setQuery(qParam);
    if (genreParam) setSelectedGenre(genreParam);
    if (langParam) setSelectedLanguage(langParam);
    if (certParam) setSelectedRating(certParam);
  }, [location.search]);

  // Compute live search suggestions
  useEffect(() => {
    if (!query.trim() && selectedGenre === 'All' && selectedLanguage === 'All' && selectedRating === 'All') {
      setFilteredResults([]);
      return;
    }

    const qLower = query.toLowerCase().trim();
    const matched = allMovies.filter((m) => {
      // Text match (title, director, synopsis, genres, or cast)
      const titleMatch = m.title?.toLowerCase().includes(qLower);
      const directorMatch = m.director?.toLowerCase().includes(qLower);
      const genreString = Array.isArray(m.genres) ? m.genres.join(' ').toLowerCase() : '';
      const textMatch = !qLower || titleMatch || directorMatch || genreString.includes(qLower);

      // Genre filter
      const genreMatch =
        selectedGenre === 'All' ||
        (Array.isArray(m.genres) && m.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase()));

      // Language filter
      const langMatch =
        selectedLanguage === 'All' ||
        m.originalLanguage?.toLowerCase() === selectedLanguage.toLowerCase() ||
        (Array.isArray(m.supportedLanguages) &&
          m.supportedLanguages.some((l) => l.toLowerCase() === selectedLanguage.toLowerCase()));

      // Certificate / Rating filter
      const ratingMatch =
        selectedRating === 'All' ||
        m.censorCertificate?.toUpperCase() === selectedRating.toUpperCase();

      return textMatch && genreMatch && langMatch && ratingMatch;
    });

    setFilteredResults(matched.slice(0, 8)); // Top 8 suggestions
  }, [query, selectedGenre, selectedLanguage, selectedRating, allMovies]);

  // Close popup menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeFiltersCount =
    (selectedGenre !== 'All' ? 1 : 0) +
    (selectedLanguage !== 'All' ? 1 : 0) +
    (selectedRating !== 'All' ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedGenre('All');
    setSelectedLanguage('All');
    setSelectedRating('All');
  };

  const handleApplyToCatalog = () => {
    setIsDropdownOpen(false);
    setIsFilterOpen(false);

    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (selectedGenre !== 'All') params.set('genre', selectedGenre);
    if (selectedLanguage !== 'All') params.set('lang', selectedLanguage);
    if (selectedRating !== 'All') params.set('cert', selectedRating);

    navigate(`/?${params.toString()}`);
  };

  const handleSelectMovie = (movie) => {
    setIsDropdownOpen(false);
    setIsFilterOpen(false);
    navigate(`/movie/${movie.id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleApplyToCatalog();
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setIsFilterOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-md lg:max-w-lg" ref={containerRef}>
      {/* Search Bar Input Container */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-neutral-400 pointer-events-none">
          <Search className="w-4 h-4 text-neutral-400" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search movies, genres, language..."
          className="w-full pl-9 pr-20 py-2 bg-white/5 hover:bg-white/10 focus:bg-[#11131c] border border-white/10 focus:border-[#f5a623] rounded-full text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none transition-all shadow-inner"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {/* Clear query */}
          {query && (
            <button
              onClick={() => {
                setQuery('');
                if (activeFiltersCount === 0) setIsDropdownOpen(false);
              }}
              className="p-1 rounded-full text-neutral-400 hover:text-white transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Filter toggle button */}
          <button
            onClick={() => {
              setIsFilterOpen(!isFilterOpen);
              setIsDropdownOpen(false);
            }}
            className={`p-1.5 rounded-full border transition flex items-center gap-1 cursor-pointer ${
              activeFiltersCount > 0
                ? 'bg-[#f5a623] text-black border-[#f5a623] font-bold'
                : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white hover:border-white/20'
            }`}
            title="Filter by genre, rating, language"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {activeFiltersCount > 0 && (
              <span className="text-[10px] font-bold px-1">{activeFiltersCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Options Popover Panel */}
      {isFilterOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#11131c] border border-white/10 rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <h4 className="text-xs font-heading font-black text-white flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#f5a623]" />
              Filter Catalog Movies
            </h4>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-[#f5a623] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* 1. Genre filter */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Genre
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedGenre === g
                      ? 'bg-[#f5a623] text-black shadow'
                      : 'bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:border-white/25'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Language filter */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Language
            </span>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedLanguage === lang
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:border-white/25'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Certificate / Rating filter */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Censor Rating / Certificate
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CERTIFICATES.map((cert) => (
                <button
                  key={cert}
                  onClick={() => setSelectedRating(cert)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedRating === cert
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:border-white/25'
                  }`}
                >
                  {cert}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-[11px] text-neutral-400">
              {filteredResults.length} matches
            </span>
            <button
              onClick={handleApplyToCatalog}
              className="px-4 py-1.5 bg-[#f5a623] hover:bg-[#e09612] text-black font-bold text-xs rounded-xl transition cursor-pointer shadow"
            >
              Apply to Catalog
            </button>
          </div>
        </div>
      )}

      {/* Live Suggestions Dropdown */}
      {isDropdownOpen && (query.trim() || activeFiltersCount > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#11131c] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2.5 bg-white/[0.02] flex items-center justify-between text-[11px] text-neutral-400">
            <span>
              Matches ({filteredResults.length})
              {activeFiltersCount > 0 && ` • ${activeFiltersCount} filters active`}
            </span>
            {filteredResults.length > 0 && (
              <button
                onClick={handleApplyToCatalog}
                className="text-[#f5a623] hover:underline font-semibold cursor-pointer"
              >
                View all in catalog →
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
            {filteredResults.length === 0 ? (
              <div className="p-6 text-center">
                <Film className="w-6 h-6 text-neutral-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-neutral-300">No movies found</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Try adjusting keywords or relaxing genre and language filters.
                </p>
              </div>
            ) : (
              filteredResults.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelectMovie(m)}
                  className="p-3 hover:bg-white/5 transition flex items-center gap-3 cursor-pointer group"
                >
                  {/* Poster Thumbnail */}
                  <img
                    src={m.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=100'}
                    alt={m.title}
                    className="w-10 h-14 rounded-md object-cover bg-neutral-900 border border-white/10 shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-white group-hover:text-[#f5a623] transition truncate">
                      {m.title}
                    </h5>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-neutral-400">
                      <span className="text-[#f5a623] font-semibold">
                        {m.originalLanguage || 'Hindi'}
                      </span>
                      <span>•</span>
                      <span>{m.genres?.[0] || 'Feature'}</span>
                      {m.censorCertificate && (
                        <>
                          <span>•</span>
                          <span className="px-1 py-0.2 bg-white/10 rounded text-[9px]">
                            {m.censorCertificate}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
