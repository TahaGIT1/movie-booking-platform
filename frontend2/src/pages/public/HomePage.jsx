import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Ticket, Play, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api.service';

export const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [availableMovieIds, setAvailableMovieIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'now-showing'
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetch(import.meta.env.VITE_API_BASE_URL + '/movies').then(res => res.json()),
      api.getAvailableShows().catch(() => [])
    ])
      .then(([movieRes, availableShows]) => {
        const activeIds = new Set((availableShows || []).map(s => s.movieId));
        setAvailableMovieIds(activeIds);

        if (movieRes.success && movieRes.data && movieRes.data.length > 0) {
          // Sort so movies with active upcoming shows are featured first
          const sorted = [...movieRes.data].sort((a, b) => {
            const aHas = activeIds.has(a.id);
            const bHas = activeIds.has(b.id);
            if (aHas && !bHas) return -1;
            if (!aHas && bHas) return 1;
            return 0;
          });
          setMovies(sorted);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (movies.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % movies.length);
    }, 4000); // 4 seconds reading speed

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
    return <div className="flex h-screen items-center justify-center bg-[#060608] text-white">No movies found.</div>;
  }

  const activeMovie = movies[activeIndex] || movies[0];
  const handleNext = () => setActiveIndex((prev) => (prev + 1) % movies.length);
  const handlePrev = () => setActiveIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  
  const handleBookNow = (targetMovieId) => {
    const idToBook = targetMovieId || activeMovie?.id;
    if (idToBook) {
      navigate(`/book/${idToBook}`);
    }
  };

  const displayedMovies = activeTab === 'now-showing' 
    ? movies.filter(m => availableMovieIds.has(m.id))
    : movies;

  return (
    <main className="w-full min-h-screen bg-[#060608] text-white font-sans overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full h-screen flex flex-col pt-32 px-12 pb-8 overflow-hidden" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
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
          <div className="flex-1 flex items-center justify-between gap-12">
            
            {/* Left Side: Movie Details */}
            <div className="w-full lg:w-[45%] flex flex-col animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-2.5 h-2.5 rounded-full ${availableMovieIds.has(activeMovie.id) ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)] animate-pulse' : 'bg-white shadow-[0_0_10px_rgba(255,255,255,1)]'}`}></div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-none">
                    {availableMovieIds.has(activeMovie.id) ? 'Now Showing' : 'Upcoming Session'}
                  </h3>
                  <p className="text-neutral-400 text-sm mt-1">
                    {availableMovieIds.has(activeMovie.id) ? 'Live screenings available to book' : 'Session schedule'}
                  </p>
                </div>
              </div>

              <div className="flex items-end gap-6 mb-6">
                <h1 className="text-6xl font-black text-white leading-none tracking-tight pb-1 line-clamp-2">
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
                <div className="px-3 py-1 border border-white/20 rounded-md text-xs font-bold text-neutral-300">IMAX 2D</div>
                <div className="px-3 py-1 border border-white/20 rounded-md text-xs font-bold text-neutral-300">{activeMovie.censorCertificate}</div>
              </div>

              <p className="text-lg text-neutral-300 leading-relaxed mb-10 max-w-xl line-clamp-3">
                {activeMovie.synopsis || `Experience ${activeMovie.title} like never before in our premium large-format auditoriums.`}
              </p>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleBookNow(activeMovie.id)} 
                  className="bg-[#ffb536] hover:bg-[#ffb536]/90 text-black font-bold px-8 py-3.5 rounded-xl transition duration-300 flex items-center gap-2 shadow-[0_0_20px_rgba(255,181,54,0.3)]"
                >
                  <Ticket size={20} /> Book Now
                </button>
                <button 
                  onClick={() => handleBookNow(activeMovie.id)}
                  className="bg-transparent border border-white/30 hover:border-white text-white font-bold px-8 py-3.5 rounded-xl transition duration-300"
                >
                  More Info
                </button>
              </div>
            </div>

            {/* Right Side: Horizontal Carousel */}
            <div className="w-full lg:w-[55%] flex flex-col items-end">
               <div className="w-full flex gap-6 overflow-x-hidden pt-12 pb-4 pl-4 mask-image-right">
                  {movies.map((movie, idx) => {
                    const isActive = idx === activeIndex;
                    if (idx < activeIndex || idx > activeIndex + 3) return null;
                    const hasShows = availableMovieIds.has(movie.id);

                    return (
                      <div 
                        key={movie.id} 
                        onClick={() => setActiveIndex(idx)}
                        className={`relative flex-shrink-0 cursor-pointer transition-all duration-500 ease-in-out group ${isActive ? 'w-64 scale-105 z-20' : 'w-48 scale-95 opacity-60 hover:opacity-100 z-10 mt-6'}`}
                      >
                        <div className="absolute -top-8 left-0 flex items-center justify-between w-full px-2 text-xs font-bold tracking-widest text-neutral-400">
                          {hasShows ? <span className="text-emerald-400">IN CINEMAS</span> : isActive ? <span className="text-[#ffb536]">BLOCKBUSTER</span> : <span></span>}
                          <span>{String(idx + 1).padStart(2, '0')}</span>
                          {isActive ? (
                             <span className="flex items-center gap-1.5 text-white"><div className="w-1.5 h-1.5 rounded-full bg-white"></div> Schedule</span>
                          ) : null}
                        </div>

                        <div className={`w-full aspect-[2/3] rounded-2xl overflow-hidden relative ${isActive ? 'border-[3px] border-[#ffb536] shadow-[0_0_30px_rgba(255,181,54,0.4)]' : 'border border-white/10'}`}>
                           <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                           <div className="absolute bottom-0 left-0 w-full p-4">
                             <h4 className="text-white font-bold text-lg leading-tight line-clamp-1 mb-1">{movie.title}</h4>
                             <p className="text-neutral-400 text-xs">{movie.genres?.[0] || 'Action'}</p>
                           </div>
                           <div className="absolute top-3 right-3">
                             <span className={`px-2.5 py-1.5 backdrop-blur-md rounded-lg text-[10px] font-bold flex items-center gap-1.5 ${hasShows ? 'bg-emerald-500/80 text-white shadow-lg' : 'bg-black/60 border border-white/20 text-white'}`}>
                               <Ticket size={12}/> {hasShows ? 'Now Showing' : 'Upcoming'}
                             </span>
                           </div>
                        </div>
                      </div>
                    );
                  })}
               </div>

               <div className="flex items-center gap-4 mt-6 mr-12">
                 <button onClick={handlePrev} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition">
                   <ChevronLeft size={20} />
                 </button>
                 <button onClick={handleNext} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition">
                   <ChevronRight size={20} />
                 </button>
               </div>
            </div>
          </div>

          <div className="w-full flex items-center justify-between border-t border-white/10 pt-6 mt-8">
            <div className="flex items-center gap-4">
              <span className="text-neutral-400 font-medium mr-2">Genre</span>
              <button className="px-5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium">Action</button>
              <button className="px-5 py-1.5 rounded-full border border-white/10 text-neutral-400 hover:text-white text-sm transition">Drama</button>
              <button className="px-5 py-1.5 rounded-full border border-white/10 text-neutral-400 hover:text-white text-sm transition">Sci-Fi</button>
            </div>
            <div className="flex items-center gap-3 text-sm font-medium">
              <button 
                onClick={() => setActiveTab('now-showing')} 
                className={`px-3.5 py-1.5 rounded-full transition text-xs font-bold flex items-center gap-1.5 ${activeTab === 'now-showing' ? 'bg-yellow-500 text-black shadow' : 'text-neutral-400 hover:text-white'}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Now Showing ({availableMovieIds.size})
              </button>
              <span className="text-neutral-600">/</span>
              <button 
                onClick={() => setActiveTab('all')} 
                className={`px-3.5 py-1.5 rounded-full transition text-xs font-bold ${activeTab === 'all' ? 'bg-white/10 text-white border border-white/20' : 'text-neutral-400 hover:text-white'}`}
              >
                All Movies ({movies.length})
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATALOG GRID */}
      <section className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              {activeTab === 'now-showing' ? 'Screening In Cinemas Now' : 'Explore Catalog'}
            </h2>
            <p className="text-neutral-400">
              {activeTab === 'now-showing' 
                ? 'Movies with active screening sessions programmed by theatre managers.' 
                : 'Discover all movies currently programmed in CineVerse auditoriums.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'now-showing' && (
              <button 
                onClick={() => setActiveTab('all')} 
                className="text-xs text-neutral-400 hover:text-yellow-400 transition"
              >
                View all movies ({movies.length})
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {displayedMovies.map((movie) => {
            const hasShows = availableMovieIds.has(movie.id);

            return (
              <div 
                key={movie.id} 
                className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/5 hover:border-yellow-500/50 transition duration-500 flex flex-col h-full animate-in fade-in slide-in-from-bottom-8 cursor-pointer"
                onClick={() => handleBookNow(movie.id)}
              >
                <div className="relative aspect-[2/3] overflow-hidden">
                  <img 
                    src={movie.posterUrl || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600'} 
                    alt={movie.title} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 ease-out" 
                  />

                  {hasShows && (
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="px-2 py-1 rounded-md bg-emerald-500/90 text-white text-[10px] font-black tracking-wider uppercase shadow-lg flex items-center gap-1 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                        Now Showing
                      </span>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-center items-center p-6 text-center z-20">
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         handleBookNow(movie.id);
                       }} 
                       className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold w-full py-3 rounded-lg mb-3 transform translate-y-4 group-hover:translate-y-0 transition duration-300 delay-100 shadow-lg shadow-yellow-500/20"
                     >
                       Book Tickets
                     </button>
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         handleBookNow(movie.id);
                       }} 
                       className="bg-transparent border border-white/50 hover:bg-white/10 text-white font-medium w-full py-3 rounded-lg transform translate-y-4 group-hover:translate-y-0 transition duration-300 delay-150"
                     >
                       View Shows & Seats
                     </button>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2 group-hover:text-yellow-500 transition">{movie.title}</h3>
                    <p className="text-xs text-neutral-400 mb-3">{movie.genres?.join(', ')}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-neutral-500 font-medium">
                    <span>{movie.originalLanguage}</span>
                    <span className="px-1.5 py-0.5 bg-white/10 rounded">{movie.censorCertificate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. PREMIUM EXPERIENCE BANNER */}
      <section className="max-w-7xl mx-auto px-6 pb-24 relative z-10">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between border border-white/10 shadow-[0_0_40px_rgba(79,70,229,0.2)]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 md:max-w-xl mb-8 md:mb-0">
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Experience IMAX with Laser</h2>
            <p className="text-indigo-200 text-lg mb-8">Crystal clear images. Next generation precision sound. The most immersive cinematic experience possible.</p>
            <button className="bg-white text-indigo-900 font-bold px-8 py-4 rounded-xl hover:bg-indigo-50 transition transform hover:scale-105">
              Find IMAX Theatres
            </button>
          </div>
          <div className="relative z-10 font-black text-7xl md:text-9xl text-white/10 transform rotate-12 select-none tracking-tighter">
            IMAX
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .mask-image-right {
          mask-image: linear-gradient(to right, black 80%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, black 80%, transparent 100%);
        }
      `}} />
    </main>
  );
};
