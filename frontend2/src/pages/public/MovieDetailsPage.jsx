import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  Clock,
  Calendar,
  Globe,
  Film,
  Play,
  Heart,
  Share2,
  ChevronRight,
  User,
  AlertCircle,
  Loader2,
  X,
  Check,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Trash2,
  Send
} from 'lucide-react';
import { api } from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';

export const MovieDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, openAuthModal } = useAuth();

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingWatchlist, setSavingWatchlist] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Reviews state (Feature 12)
  const [reviewsData, setReviewsData] = useState({ reviews: [], totalReviews: 0, averageRating: null });
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewTextInput, setReviewTextInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const loadReviews = async () => {
    try {
      const res = await api.getMovieReviews(id);
      const data = res?.data || res;
      if (data && Array.isArray(data.reviews)) {
        setReviewsData(data);
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getMovieById(id);
        const movieObj = res?.data || res;
        if (movieObj && (movieObj.id || movieObj.title)) {
          setMovie(movieObj);
        } else {
          setError('Movie not found');
        }
      } catch (err) {
        setError(err.message || 'Failed to load movie details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMovieData();
      loadReviews();
    }
  }, [id]);

  // Check Watchlist status if authenticated
  useEffect(() => {
    if (token && id) {
      api.getWatchlistStatus(id)
        .then((res) => {
          if (res?.success) setIsSaved(Boolean(res.inWatchlist));
        })
        .catch(() => {});
    }
  }, [token, id]);

  const handleToggleWatchlist = async () => {
    if (!token) {
      openAuthModal('login');
      return;
    }
    setSavingWatchlist(true);
    try {
      const res = await api.toggleWatchlist(id);
      if (res?.success) {
        setIsSaved(res.inWatchlist);
      }
    } catch (e) {
      // ignore
    } finally {
      setSavingWatchlist(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      openAuthModal('login');
      return;
    }
    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');
    try {
      const res = await api.submitMovieReview(id, {
        ratingScore: ratingInput,
        reviewText: reviewTextInput
      });
      if (res.success) {
        setReviewSuccess('Your review has been shared!');
        setReviewTextInput('');
        loadReviews();
        setTimeout(() => setReviewSuccess(''), 4000);
      } else {
        setReviewError(res.message || 'Failed to submit review');
      }
    } catch (err) {
      setReviewError(err.message || 'Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    try {
      await api.deleteMovieReview(id);
      loadReviews();
    } catch (err) {
      // ignore
    }
  };

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=1`
      : null;
  };

  const formatDuration = (mins) => {
    if (!mins) return 'N/A';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060608] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
        <p className="text-neutral-400 text-sm font-medium tracking-wide">Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle size={48} className="text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Movie Not Available</h2>
          <p className="text-sm text-neutral-400">{error || 'This movie does not exist in our catalog.'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition"
          >
            <ArrowLeft size={16} /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const embedUrl = getYoutubeEmbedUrl(movie.trailerUrl);
  const castList = Array.isArray(movie.castMembers) ? movie.castMembers : [];
  const genresList = Array.isArray(movie.genres) ? movie.genres : [];
  const supportedLangs = Array.isArray(movie.supportedLanguages) ? movie.supportedLanguages : [];

  return (
    <div className="min-h-screen bg-[#060608] text-white pb-24 font-sans">
      {/* 1. HERO BACKDROP */}
      <div className="relative w-full h-[45vh] sm:h-[55vh] lg:h-[65vh] bg-neutral-950 overflow-hidden">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-top filter blur-md opacity-25 scale-105"
          />
        ) : (
          <div className="w-full h-full bg-[#0a0b0e]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060608] via-transparent to-transparent" />

        {/* Back Link */}
        <div className="absolute top-24 left-6 sm:left-12 z-20">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-white/10 text-white text-xs font-semibold border border-white/15 backdrop-blur-md transition"
          >
            <ArrowLeft size={14} />
            <span>Back to Discovery</span>
          </Link>
        </div>
      </div>

      {/* 2. MAIN DETAILS CONTAINER */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 -mt-36 sm:-mt-48 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Poster & Quick Actions */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center md:items-start">
            <div className="relative w-60 sm:w-68 md:w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10 bg-neutral-900 group">
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600">
                  <Film size={48} className="opacity-40 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">No Poster</span>
                </div>
              )}

              {movie.trailerUrl && (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-yellow-500 text-black flex items-center justify-center shadow-lg shadow-yellow-500/40">
                    <Play size={24} className="fill-black translate-x-0.5" />
                  </div>
                  <span className="text-white text-xs font-bold uppercase tracking-wider">Play Trailer</span>
                </button>
              )}
            </div>

            {/* Quick Actions Strip */}
            <div className="w-full mt-4 flex items-center gap-3">
              <button
                onClick={handleToggleWatchlist}
                disabled={savingWatchlist}
                className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition cursor-pointer ${
                  isSaved
                    ? 'border-red-500/50 bg-red-500/10 text-red-400'
                    : 'border-white/10 bg-white/5 text-neutral-300 hover:border-white/20'
                }`}
              >
                <Heart size={15} className={isSaved ? 'fill-red-500 text-red-500' : ''} />
                <span>{isSaved ? 'Saved in Watchlist' : 'Add to Watchlist'}</span>
              </button>

              <button
                onClick={handleShare}
                className="py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-neutral-300 hover:border-white/20 flex items-center justify-center transition cursor-pointer relative"
                title="Share Movie Link"
              >
                {isCopied ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
                {isCopied && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500 text-black text-[10px] font-bold rounded shadow whitespace-nowrap">
                    Link Copied!
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Title, Metadata, Synopsis, Cast, Book Now */}
          <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-end pt-4 space-y-6">
            <div>
              {/* Badges strip */}
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span className="bg-yellow-500 text-black text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                  {movie.censorCertificate || 'U/A'}
                </span>
                <span className="text-xs text-neutral-400 flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-md">
                  <Clock size={12} className="text-neutral-400" />
                  {formatDuration(movie.durationMinutes)}
                </span>
                {movie.releaseDate && (
                  <span className="text-xs text-neutral-400 flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-md">
                    <Calendar size={12} className="text-neutral-400" />
                    {new Date(movie.releaseDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                )}
                {reviewsData.averageRating && (
                  <span className="text-xs font-bold text-yellow-400 flex items-center gap-1 bg-yellow-500/15 border border-yellow-500/30 px-2.5 py-0.5 rounded-md">
                    <Star size={12} className="fill-yellow-400" />
                    {reviewsData.averageRating} / 5 ({reviewsData.totalReviews} reviews)
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {movie.title}
              </h1>

              {/* Genres & Languages */}
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <div className="flex flex-wrap gap-1.5">
                  {genresList.map((g, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-neutral-300"
                    >
                      {g}
                    </span>
                  ))}
                </div>
                <span className="text-neutral-600 hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <Globe size={13} className="text-yellow-500" />
                  <span className="font-semibold text-neutral-200">{movie.originalLanguage}</span>
                  {supportedLangs.length > 1 && (
                    <span className="text-neutral-500">
                      (+{supportedLangs.filter((l) => l !== movie.originalLanguage).join(', ')})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Synopsis */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">About the Movie</h3>
              <p className="text-neutral-300 text-sm sm:text-base leading-relaxed max-w-4xl font-normal">
                {movie.synopsis || 'No synopsis available for this title.'}
              </p>
            </div>

            {/* Crew / Director */}
            {movie.director && (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Director:</span>
                <span className="text-sm font-bold text-white bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                  {movie.director}
                </span>
              </div>
            )}

            {/* Cast Carousel / Grid */}
            {castList.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Top Cast</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {castList.map((actor, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition"
                    >
                      <div className="w-9 h-9 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center shrink-0 text-neutral-400">
                        <User size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{actor.name}</p>
                        {actor.role && (
                          <p className="text-[11px] text-neutral-400 truncate">{actor.role}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Banner Bar */}
            <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-yellow-500" />
                  <span>Cinemas & Theatres Available</span>
                </p>
                <p className="text-sm font-semibold text-white">
                  Reserve your seats with live auditorium mapping
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {movie.trailerUrl && (
                  <button
                    onClick={() => setIsTrailerOpen(true)}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition"
                  >
                    <Play size={13} className="fill-white" />
                    Trailer
                  </button>
                )}
                <button
                  onClick={() => navigate(`/movie/${movie.id}/shows`)}
                  className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold px-6 py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/25 transition active:scale-95 cursor-pointer"
                >
                  <span>Book Tickets</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. REVIEWS & RATINGS SECTION (Feature 12) */}
        <div className="mt-16 pt-12 border-t border-white/10 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-500/15 text-yellow-500 border border-yellow-500/30 mb-2 inline-flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-yellow-500" />
                COMMUNITY REVIEWS & RATINGS
              </span>
              <h2 className="text-2xl font-heading font-black text-white">
                Audience Reviews ({reviewsData.totalReviews})
              </h2>
            </div>

            {reviewsData.averageRating && (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                <div className="text-3xl font-heading font-black text-yellow-400">
                  {reviewsData.averageRating}
                </div>
                <div className="text-xs text-neutral-400">
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={12}
                        className={s <= Math.round(reviewsData.averageRating) ? 'fill-yellow-400' : 'text-neutral-600'}
                      />
                    ))}
                  </div>
                  <span>out of 5 stars</span>
                </div>
              </div>
            )}
          </div>

          {/* Write a Review Box */}
          <div className="bg-[#11131c] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-heading font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-yellow-500" />
              Write a Review
            </h3>

            {reviewSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{reviewSuccess}</span>
              </div>
            )}

            {reviewError && (
              <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">
                  Your Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatingInput(star)}
                      className="p-1 cursor-pointer transition hover:scale-110"
                    >
                      <Star
                        size={24}
                        className={
                          star <= ratingInput
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-neutral-600 hover:text-yellow-500/50'
                        }
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-neutral-300 ml-2">
                    {ratingInput} / 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-2">
                  Written Feedback
                </label>
                <textarea
                  rows={3}
                  value={reviewTextInput}
                  onChange={(e) => setReviewTextInput(e.target.value)}
                  placeholder="Share your thoughts about the performance, plot, cinematography, or soundtrack..."
                  className="w-full p-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-yellow-500 transition resize-none placeholder:text-neutral-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-neutral-500">
                  {token ? `Reviewing as ${user?.fullName || 'Verified Customer'}` : 'Sign in required to publish review'}
                </span>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {submittingReview ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Post Review</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Reviews */}
          <div className="space-y-4">
            {reviewsData.reviews.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-neutral-400">
                Be the first to review this movie! Share your reaction with fellow cinema lovers.
              </div>
            ) : (
              reviewsData.reviews.map((rev) => {
                const isOwnReview = user && rev.userId === user.id;
                const dateStr = new Date(rev.createdAt).toLocaleDateString([], {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-[#11131c] border border-white/10 space-y-2 shadow"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 font-bold text-xs flex items-center justify-center border border-yellow-500/30">
                          {rev.user?.fullName ? rev.user.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {rev.user?.fullName || 'Cinema Enthusiast'}
                            </span>
                            {isOwnReview && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-500">{dateStr}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-0.5 text-yellow-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              className={s <= rev.ratingScore ? 'fill-yellow-400' : 'text-neutral-700'}
                            />
                          ))}
                        </div>

                        {isOwnReview && (
                          <button
                            onClick={handleDeleteReview}
                            className="p-1 text-neutral-500 hover:text-red-400 transition"
                            title="Delete your review"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {rev.reviewText && (
                      <p className="text-xs sm:text-sm text-neutral-300 pt-1 leading-relaxed">
                        {rev.reviewText}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. TRAILER MODAL */}
      {isTrailerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/60">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Play size={14} className="text-yellow-500" />
                {movie.title} — Official Trailer
              </h3>
              <button
                onClick={() => setIsTrailerOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative aspect-video w-full bg-black">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title="Official Trailer"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500">
                  <Film size={48} className="opacity-40 mb-2" />
                  <p>Trailer not available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
