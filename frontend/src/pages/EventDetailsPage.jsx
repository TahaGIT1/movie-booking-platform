import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Rating } from '../components/Rating';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { BookingModal } from '../components/BookingModal';
import { ArrowLeft, Calendar, MapPin, Heart, Share2 } from 'lucide-react';

export const EventDetailsPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    api.getEventById(id).then((data) => {
      if (isMounted) {
        setEvent(data || null);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setEvent(null);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-neutral-400">
        Loading event details from database...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-white mb-2">Event Not Found</h2>
        <p className="text-sm text-neutral-400 mb-6">This event does not exist in the database.</p>
        <Link
          to="/events"
          className="px-4 py-2 rounded-xl bg-[#f5a623] text-black font-semibold text-xs"
        >
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20">
      {/* Hero Backdrop */}
      <div className="relative w-full h-[55vh] min-h-[420px] overflow-hidden">
        <img
          src={event.backdropImage || event.posterImage || '/images/backgrounds/batman_hero.jpg'}
          alt={event.title}
          className="w-full h-full object-cover object-center filter brightness-65"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0e] via-[#0a0b0e]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0b0e] via-transparent to-transparent" />

        {/* Back Link */}
        <div className="absolute top-6 left-6 z-20">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-white/10 text-white text-xs font-medium border border-white/15 backdrop-blur-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Events</span>
          </Link>
        </div>
      </div>

      {/* Main Details Section */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 -mt-36 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Poster Column */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center md:items-start">
            <div className="w-56 sm:w-64 md:w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10 bg-neutral-900">
              <img
                src={event.posterImage || '/images/movies/the-batman.jpg'}
                alt={event.title}
                className="w-full h-full object-cover"
              />
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
                <span>{isLiked ? 'Interested' : 'Interested?'}</span>
              </button>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: event.title, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }
                }}
                className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-neutral-300 hover:border-white/20 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-end pt-4 md:pt-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {event.badgeTopRight && (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f5a623] text-black">
                  {event.badgeTopRight}
                </span>
              )}
              {event.formats &&
                event.formats.map((fmt) => (
                  <Badge key={fmt} variant="outline">
                    {fmt}
                  </Badge>
                ))}
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-black text-white tracking-tight leading-tight mb-4">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-300 mb-6">
              <Rating score={event.rating || 4.5} />
              <span>•</span>
              <span>{event.genre || 'Live Event'}</span>
              {event.duration && (
                <>
                  <span>•</span>
                  <span>{event.duration}</span>
                </>
              )}
            </div>

            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed mb-8 max-w-3xl">
              {event.description}
            </p>

            <div className="flex items-center gap-4">
              <PrimaryButton icon="ticket" onClick={() => setIsBookingOpen(true)}>
                Book Passes Now
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>

      {isBookingOpen && (
        <BookingModal item={event} onClose={() => setIsBookingOpen(false)} />
      )}
    </div>
  );
};
