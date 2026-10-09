import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { moviesData } from '../data/movies';
import { api } from '../services/api';
import type { MediaItem } from '../types';
import { Rating } from '../components/Rating';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { BookingModal } from '../components/BookingModal';
import { TrailerModal } from '../components/TrailerModal';
import { ArrowLeft, Clock, Calendar, Share2, Heart, Play, Check } from 'lucide-react';

export const MovieDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const initialMovie = moviesData.find((m) => m.id === id) || moviesData[0];
  const [movie, setMovie] = useState<MediaItem>(initialMovie);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    api.getMovieById(id).then((data) => {
      if (isMounted && data) {
        setMovie(data);
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

  return (
    <div className="relative min-h-screen pb-20">
      {/* Hero Backdrop */}
      <div className="relative w-full h-[55vh] min-h-[420px] overflow-hidden">
        <img
          src={movie.backdropImage}
          alt={movie.title}
          className="w-full h-full object-cover object-center filter brightness-65"
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
                src={movie.posterImage}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <button
                onClick={() => setIsTrailerOpen(true)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-[#f5a623] text-black flex items-center justify-center shadow-lg shadow-[#f5a623]/40">
                  <Play className="w-6 h-6 fill-black translate-x-0.5" />
                </div>
                <span className="text-white text-xs font-bold uppercase tracking-wider">Play Trailer</span>
              </button>
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
                <span>{isLiked ? 'Saved' : 'Wishlist'}</span>
              </button>

              <button
                onClick={handleShare}
                className="py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-neutral-300 hover:border-white/20 flex items-center justify-center transition-colors cursor-pointer relative"
                title="Share Movie"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                {isCopied && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500 text-black text-[10px] font-bold rounded shadow whitespace-nowrap">
                    Link Copied!
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-end pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="gold">{movie.heroBadge || 'BLOCKBUSTER'}</Badge>
              <span className="text-xs text-neutral-400">Release: {movie.releaseDate || '2024'} • {movie.duration || '2h 56m'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight mb-3">
              {movie.title}
            </h1>

            {/* Rating and formats */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Rating score={movie.rating} />
              <span className="text-sm font-semibold text-[#f5a623]">
                {movie.rating} / 5.0
              </span>
              <span className="text-xs text-neutral-400">|</span>
              <span className="text-xs text-neutral-300 font-medium">
                {movie.genre}
              </span>
              <div className="flex items-center gap-1.5">
                {movie.formats.map((fmt) => (
                  <Badge key={fmt} variant="outline">
                    {fmt}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Cast & Director */}
            {(movie.director || movie.cast) && (
              <div className="mb-6 flex flex-wrap gap-6 text-xs text-neutral-300 border-y border-white/10 py-3">
                {movie.director && (
                  <div>
                    <span className="text-neutral-500 block uppercase text-[10px] font-semibold">Director</span>
                    <span className="font-semibold text-white">{movie.director}</span>
                  </div>
                )}
                {movie.cast && movie.cast.length > 0 && (
                  <div>
                    <span className="text-neutral-500 block uppercase text-[10px] font-semibold">Starring</span>
                    <span className="font-semibold text-white">{movie.cast.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Synopsis */}
            <div className="mb-8 max-w-3xl">
              <h3 className="text-sm uppercase font-semibold tracking-wider text-neutral-400 mb-2">
                About The Movie
              </h3>
              <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
                {movie.description}
              </p>
            </div>

            {/* Booking action bar */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl">
              <div>
                <div className="text-xs text-neutral-400 flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#f5a623]" />
                  <span>Now Showing in Kuala Lumpur, Penang, JB</span>
                </div>
                <div className="text-xs text-neutral-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Next Available: Tomorrow at 06:30 PM (IMAX)</span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Trailer</span>
                </button>
                <PrimaryButton onClick={() => setIsBookingOpen(true)}>
                  Book Tickets
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingOpen && (
        <BookingModal item={movie} onClose={() => setIsBookingOpen(false)} />
      )}

      {/* Trailer Modal */}
      <TrailerModal
        item={movie}
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        onOpenBooking={() => {
          setIsBookingOpen(true);
        }}
      />
    </div>
  );
};
