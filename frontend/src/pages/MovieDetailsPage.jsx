import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Rating } from '../components/Rating';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { BookingModal } from '../components/BookingModal';
import { TrailerModal } from '../components/TrailerModal';
import { ArrowLeft, Clock, Calendar, Share2, Heart, Play, Check } from 'lucide-react';

export const MovieDetailsPage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    api.getMovieById(id).then((data) => {
      if (isMounted) {
        setMovie(data || null);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setMovie(null);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-neutral-400">
        Loading movie details from database...
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-2">Movie Not Found</h2>
        <p className="text-sm text-neutral-400 mb-6">This title does not exist in the database catalog.</p>
        <Link
          to="/"
          className="px-4 py-2 rounded-xl bg-[#f5a623] text-black font-semibold text-xs"
        >
          Back to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20">
      {/* Hero Backdrop */}
      <div className="relative w-full h-[55vh] min-h-[420px] overflow-hidden">
        <img
          src={movie.backdropImage || movie.posterImage || '/images/backgrounds/batman_hero.jpg'}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-65"
          onError={(e) => {
            e.target.src = '/images/backgrounds/batman_hero.jpg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0e] via-[#0a0b0e]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0b0e] via-transparent to-transparent" />

        {/* Back Link */}
        <div className="absolute top-6 left-6 z-20">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-white/10 text-white text-xs font-medium border border-white/15 backdrop-blur-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Movies</span>
          </Link>
        </div>
      </div>

      {/* Main Details Section */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 -mt-36 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Poster Column */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center md:items-start">
            <div className="relative w-56 sm:w-64 md:w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10 bg-neutral-900 group">
              <img
                src={movie.posterImage || '/images/movies/the-batman.jpg'}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.target.src = '/images/movies/the-batman.jpg';
                }}
              />
              {movie.trailerUrl && (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-[#f5a623] text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    Watch Trailer
                  </span>
                </button>
              )}
            </div>

            <div className="w-full mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-colors cursor-pointer ${
                  isLiked
                    ? 'border-red-500/50 bg-red-500/10 text-red-400'
                    : 'border-white/10 bg-white/5 text-neutral-300 hover:border-white/20'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{isLiked ? 'Liked' : 'Add to Watchlist'}</span>
              </button>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-neutral-300 hover:border-white/20 transition-colors cursor-pointer"
                title="Share link"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-end pt-4 md:pt-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {movie.heroBadge && (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f5a623] text-black">
                  {movie.heroBadge}
                </span>
              )}
              {movie.formats &&
                movie.formats.map((fmt) => (
                  <Badge key={fmt} variant="outline">
                    {fmt}
                  </Badge>
                ))}
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-black text-white tracking-tight leading-tight mb-4">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-300 mb-6">
              <Rating score={movie.rating || 4.5} />
              <span>•</span>
              <span>{movie.genre || 'Action, Drama'}</span>
              {movie.duration && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#f5a623]" />
                    {movie.duration}
                  </span>
                </>
              )}
            </div>

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed mb-8 max-w-3xl">
              {movie.description}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <PrimaryButton icon="ticket" onClick={() => setIsBookingOpen(true)}>
                Book Tickets Now
              </PrimaryButton>

              {movie.trailerUrl && (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="px-5 py-3 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Trailer</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Extended Cast & Director Details */}
        <div className="mt-16 pt-10 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
              Director
            </span>
            <span className="text-sm font-medium text-white">
              {movie.director || 'Film Director'}
            </span>
          </div>

          <div className="md:col-span-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-2">
              Starring Cast
            </span>
            <div className="flex flex-wrap gap-2">
              {movie.cast && movie.cast.length > 0 ? (
                movie.cast.map((actor) => (
                  <span
                    key={actor}
                    className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300"
                  >
                    {actor}
                  </span>
                ))
              ) : (
                <span className="text-xs text-neutral-400">Cast details available upon request.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {isBookingOpen && (
        <BookingModal item={movie} onClose={() => setIsBookingOpen(false)} />
      )}

      {isTrailerOpen && movie.trailerUrl && (
        <TrailerModal
          item={movie}
          isOpen={isTrailerOpen}
          onClose={() => setIsTrailerOpen(false)}
        />
      )}
    </div>
  );
};
