import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Play,
  Search,
  Filter,
  X,
  RotateCcw,
  Film,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api.service';

const GENRE_OPTIONS = [
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

const LANGUAGE_OPTIONS = [
  'All Languages',
  'Hindi',
  'Kannada',
  'Telugu',
  'Tamil',
  'Malayalam',
  'English'
];

const RATING_OPTIONS = [
  'All Certificates',
  'U',
  'U/A',
  'A'
];

export const HomePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openAuthModal, token } = useAuth();

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || 'All');
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('lang') || 'All Languages');
  const [selectedRating, setSelectedRating] = useState(searchParams.get('cert') || 'All Certificates');

  useEffect(() => {
    api.getMovies()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMovies(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Sync state with URL search params changes
  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    const genreParam = searchParams.get('genre') || 'All';
    const langParam = searchParams.get('lang') || 'All Languages';
    const certParam = searchParams.get('cert') || 'All Certificates';

    setSearchQuery(qParam);
    setSelectedGenre(genreParam);
    setSelectedLanguage(langParam);
    setSelectedRating(certParam);
  }, [searchParams]);

  // Update URL search parameters when filters change
  const updateUrlFilters = (newQ, newGenre, newLang, newCert) => {
    const params = new URLSearchParams();
    if (newQ?.trim()) params.set('q', newQ.trim());
    if (newGenre && newGenre !== 'All') params.set('genre', newGenre);
    if (newLang && newLang !== 'All Languages' && newLang !== 'All') params.set('lang', newLang);
    if (newCert && newCert !== 'All Certificates' && newCert !== 'All') params.set('cert', newCert);
    setSearchParams(params);
  };

  const handleQueryChange = (val) => {
    setSearchQuery(val);
    updateUrlFilters(val, selectedGenre, selectedLanguage, selectedRating);
  };

  const handleGenreChange = (g) => {
    setSelectedGenre(g);
    updateUrlFilters(searchQuery, g, selectedLanguage, selectedRating);
  };

  const handleLanguageChange = (l) => {
    setSelectedLanguage(l);
    updateUrlFilters(searchQuery, selectedGenre, l, selectedRating);
  };

  const handleRatingChange = (r) => {
    setSelectedRating(r);
    updateUrlFilters(searchQuery, selectedGenre, selectedLanguage, r);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('All');
    setSelectedLanguage('All Languages');
    setSelectedRating('All Certificates');
    setSearchParams({});
  };

  // Filtered movies computation
  const filteredMovies = useMemo(() => {
    const qLower = searchQuery.toLowerCase().trim();

    return movies.filter((m) => {
      // 1. Search Query Match
      const titleMatch = m.title?.toLowerCase().includes(qLower);
      const directorMatch = m.director?.toLowerCase().includes(qLower);
      const genreString = Array.isArray(m.genres) ? m.genres.join(' ').toLowerCase() : '';
      const textMatch = !qLower || titleMatch || directorMatch || genreString.includes(qLower);

      // 2. Genre Match
      const genreMatch =
        selectedGenre === 'All' ||
        (Array.isArray(m.genres) && m.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase()));

      // 3. Language Match
      const langMatch =
        selectedLanguage === 'All Languages' ||
        selectedLanguage === 'All' ||
        m.originalLanguage?.toLowerCase() === selectedLanguage.toLowerCase() ||
        (Array.isArray(m.supportedLanguages) &&
          m.supportedLanguages.some((l) => l.toLowerCase() === selectedLanguage.toLowerCase()));

      // 4. Rating / Certificate Match
      const ratingMatch =
        selectedRating === 'All Certificates' ||
        selectedRating === 'All' ||
        m.censorCertificate?.toUpperCase() === selectedRating.toUpperCase();

      return textMatch && genreMatch && langMatch && ratingMatch;
    });
  }, [movies, searchQuery, selectedGenre, selectedLanguage, selectedRating]);

  // Hero carousel auto-timer
  useEffect(() => {
    if (movies.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % movies.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [movies.length, isPaused]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#060608]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#060608] text-white">
        No movies found in catalog.
      </div>
    );
  }

  const activeMovie = movies[activeIndex] || movies[0];
  const handleNext = () => setActiveIndex((prev) => (prev + 1) % movies.length);
  const handlePrev = () => setActiveIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  const handleBookNow = (movie = activeMovie) => {
    if (movie?.id) {
      navigate(`/movie/${movie.id}/shows`);
    }
  };
  const handleViewDetails = (movie = activeMovie) => {
    if (movie?.id) {
      navigate(`/movie/${movie.id}`);
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedGenre !== 'All' ||
    selectedLanguage !== 'All Languages' ||
    selectedRating !== 'All Certificates';

  return (
    <main className="w-full min-h-screen bg-[#060608] text-white font-sans overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section
        className="relative w-full h-screen flex flex-col pt-32 px-6 sm:px-12 pb-8 overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Image with Heavy Gradients */}
        <div className="absolute inset-0 z-0 transition-all duration-1000 ease-in-out">
          <img
            src={activeMovie.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2000'}
            alt="Background"
            className="w-full h-full object-cover object-top opacity-30 transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060608] via-[#060608]/90 to-transparent w-[60%]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/60 to-transparent h-[40%] mt-auto"></div>
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-between gap-8 lg:gap-12">
            {/* Left Side: Movie Details */}
            <div className="w-full lg:w-[45%] flex flex-col animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)]"></div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-none">Tomorrow</h3>
                  <p className="text-neutral-500 text-sm mt-1">Session schedule</p>
                </div>
              </div>

              <div className="flex items-end gap-6 mb-6">
                <h1 className="text-4xl sm:text-6xl font-black text-white leading-none tracking-tight pb-1 line-clamp-2">
                  {activeMovie.title}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm font-medium mb-8">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} className="text-neutral-600" />
                </div>
                <div className="text-neutral-400">
                  Genre: <span className="text-neutral-200">{activeMovie.genres?.join(', ') || 'Action, Thriller'}</span>
                </div>
                <div className="px-3 py-1 border border-white/20 rounded-md text-xs font-bold text-neutral-300">
                  IMAX 2D
                </div>
                <div className="px-3 py-1 border border-white/20 rounded-md text-xs font-bold text-neutral-300">
                  {activeMovie.censorCertificate || 'U/A'}
                </div>
              </div>

              <p className="text-base sm:text-lg text-neutral-300 leading-relaxed mb-10 max-w-xl line-clamp-3">
                {activeMovie.synopsis || `Experience ${activeMovie.title} like never before in our premium large-format auditoriums.`}
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleBookNow(activeMovie)}
                  className="bg-[#ffb536] hover:bg-[#ffb536]/90 text-black font-bold px-8 py-3.5 rounded-xl transition duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(255,181,54,0.3)] cursor-pointer"
                >
                  <Ticket size={20} /> Book Now
                </button>
                <button
                  onClick={() => handleViewDetails(activeMovie)}
                  className="bg-transparent border border-white/30 hover:border-white text-white font-bold px-8 py-3.5 rounded-xl transition duration-300 cursor-pointer"
                >
                  More Info
                </button>
              </div>
            </div>

            {/* Right Side: Horizontal Carousel */}
            <div className="w-full lg:w-[55%] hidden sm:flex flex-col items-end">
              <div className="w-full flex gap-6 overflow-x-hidden pt-12 pb-4 pl-4 mask-image-right">
                {movies.map((movie, idx) => {
                  const isActive = idx === activeIndex;
                  if (idx < activeIndex || idx > activeIndex + 3) return null;

                  return (
                    <div
                      key={movie.id}
                      onClick={() => setActiveIndex(idx)}
                      className={`relative flex-shrink-0 cursor-pointer transition-all duration-500 ease-in-out group ${
                        isActive ? 'w-64 scale-105 z-20' : 'w-48 scale-95 opacity-60 hover:opacity-100 z-10 mt-6'
                      }`}
                    >
                      <div className="absolute -top-8 left-0 flex items-center justify-between w-full px-2 text-xs font-bold tracking-widest text-neutral-400">
                        {isActive && <span className="text-[#ffb536]">BLOCKBUSTER</span>}
                        <span>{String(idx + 1).padStart(2, '0')}</span>
                        {isActive ? (
                          <span className="flex items-center gap-1.5 text-white">
                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div> Tomorrow
                          </span>
                        ) : null}
                      </div>

                      <div
                        className={`w-full aspect-[2/3] rounded-2xl overflow-hidden relative ${
                          isActive
                            ? 'border-[3px] border-[#ffb536] shadow-[0_0_30px_rgba(255,181,54,0.4)]'
                            : 'border border-white/10'
                        }`}
                      >
                        <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 w-full p-4">
                          <h4 className="text-white font-bold text-lg leading-tight line-clamp-1 mb-1">
                            {movie.title}
                          </h4>
                          <p className="text-neutral-400 text-xs">{movie.genres?.[0] || 'Action'}</p>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/20 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5">
                            {isActive ? (
                              <>
                                <Ticket size={12} /> Tomorrow
                              </>
                            ) : (
                              'Schedule'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 mt-6 mr-12">
                <button
                  onClick={handlePrev}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Genre Filter Buttons on Hero Strip */}
          <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between border-t border-white/10 pt-6 mt-8 gap-4">
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar w-full md:w-auto pb-1">
              <span className="text-neutral-400 font-bold text-xs uppercase tracking-wider mr-1 shrink-0">
                Genre:
              </span>
              {['All', 'Action', 'Drama', 'Sci-Fi', 'Thriller', 'Comedy'].map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    handleGenreChange(g);
                    document.getElementById('explore-catalog')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition shrink-0 cursor-pointer ${
                    selectedGenre === g
                      ? 'bg-[#ffb536] text-black shadow'
                      : 'border border-white/10 bg-white/5 text-neutral-300 hover:text-white hover:border-white/30'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-neutral-400">
              <span className="text-white font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#ffb536]" />
                {movies.length} Premieres Active
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. EXPLORE CATALOG (With Search Bar & Multi-Filters) */}
      <section id="explore-catalog" className="max-w-7xl mx-auto px-6 py-16 sm:py-24 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-500/15 text-yellow-500 border border-yellow-500/30 mb-2 inline-flex items-center gap-1.5">
              <Film className="w-3 h-3" />
              CINEMA CATALOG & TICKETING
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-white">
              Explore All Movies
            </h2>
            <p className="text-neutral-400 text-xs sm:text-sm mt-1">
              Filter by genre, censor rating, and audio languages to discover your next screening.
            </p>
          </div>

          <div className="text-xs text-neutral-400 font-medium">
            Showing <span className="text-white font-bold">{filteredMovies.length}</span> of {movies.length} movies
          </div>
        </div>

        {/* Search & Filter Control Bar */}
        <div className="bg-[#11131c] border border-white/10 rounded-2xl p-4 sm:p-5 mb-10 shadow-xl space-y-4">
          {/* Search Input Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search movies by title, director, cast..."
              className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-yellow-500 transition placeholder:text-neutral-500"
            />
            {searchQuery && (
              <button
                onClick={() => handleQueryChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & Pills Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
            {/* Genre Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-xs text-neutral-500 font-bold uppercase tracking-wider shrink-0 mr-1">
                Genre:
              </span>
              {GENRE_OPTIONS.map((g) => (
                <button
                  key={g}
                  onClick={() => handleGenreChange(g)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedGenre === g
                      ? 'bg-yellow-500 text-black shadow'
                      : 'bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:border-white/25'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {/* Language & Rating Selectors */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Language Selector */}
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-neutral-500 font-semibold">Lang:</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer"
                >
                  {LANGUAGE_OPTIONS.map((l) => (
                    <option key={l} value={l} className="bg-[#171a26] text-white">
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Certificate / Rating Selector */}
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-neutral-500 font-semibold">Rating:</span>
                <select
                  value={selectedRating}
                  onChange={(e) => handleRatingChange(e.target.value)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer"
                >
                  {RATING_OPTIONS.map((r) => (
                    <option key={r} value={r} className="bg-[#171a26] text-white">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset button if active */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredMovies.length === 0 ? (
          <div className="bg-[#11131c] border border-white/10 rounded-2xl p-12 text-center max-w-md mx-auto shadow-xl">
            <Film className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Movies Matched</h3>
            <p className="text-xs text-neutral-400 mb-6">
              We couldn't find any movie matching your current keyword, genre, or rating filter.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          /* Movie Cards Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredMovies.map((movie) => (
              <div
                key={movie.id}
                className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/5 hover:border-yellow-500/50 transition duration-500 flex flex-col h-full animate-in fade-in"
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-neutral-900">
                  <img
                    src={movie.posterUrl || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600'}
                    alt={movie.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 ease-out"
                  />

                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-center items-center p-6 text-center">
                    <button
                      onClick={() => handleBookNow(movie)}
                      className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold w-full py-3 rounded-lg mb-3 transform translate-y-4 group-hover:translate-y-0 transition duration-300 delay-100 cursor-pointer"
                    >
                      Book Tickets
                    </button>
                    <button
                      onClick={() => handleViewDetails(movie)}
                      className="bg-transparent border border-white/50 hover:bg-white/10 text-white font-medium w-full py-3 rounded-lg transform translate-y-4 group-hover:translate-y-0 transition duration-300 delay-150 cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                <div
                  className="p-4 flex-1 flex flex-col justify-between cursor-pointer"
                  onClick={() => handleViewDetails(movie)}
                >
                  <div>
                    <h3 className="font-bold text-base leading-tight mb-1 line-clamp-2 group-hover:text-yellow-500 transition">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mb-3">{movie.genres?.join(', ') || 'Feature Film'}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-neutral-500 font-medium">
                    <span className="text-neutral-300">{movie.originalLanguage || 'Hindi'}</span>
                    <span className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-neutral-300">
                      {movie.censorCertificate || 'U/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. PREMIUM EXPERIENCE BANNER */}
      <section className="max-w-7xl mx-auto px-6 pb-24 relative z-10">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between border border-white/10 shadow-[0_0_40px_rgba(79,70,229,0.2)]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 md:max-w-xl mb-8 md:mb-0">
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Experience IMAX with Laser</h2>
            <p className="text-indigo-200 text-lg mb-8">
              Crystal clear images. Next generation precision sound. The most immersive cinematic experience possible.
            </p>
            <button
              onClick={() => {
                document.getElementById('explore-catalog')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-indigo-900 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 transition transform hover:scale-105 cursor-pointer"
            >
              Browse Screenings
            </button>
          </div>
          <div className="relative z-10 font-black text-7xl md:text-9xl text-white/10 transform rotate-12 select-none tracking-tighter">
            IMAX
          </div>
        </div>
      </section>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .mask-image-right {
          mask-image: linear-gradient(to right, black 80%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, black 80%, transparent 100%);
        }
      `
        }}
      />
    </main>
  );
};
