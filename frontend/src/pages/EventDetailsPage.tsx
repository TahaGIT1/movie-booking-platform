import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventsData } from '../data/events';
import { api } from '../services/api';
import type { MediaItem } from '../types';
import { Rating } from '../components/Rating';
import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { BookingModal } from '../components/BookingModal';
import { ArrowLeft, Calendar, MapPin, Sparkles, Heart, Share2 } from 'lucide-react';

export const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const initialEvent = eventsData.find((e) => e.id === id) || eventsData[0];
  const [event, setEvent] = useState<MediaItem>(initialEvent);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    api.getEventById(id).then((data) => {
      if (isMounted && data) {
        setEvent(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [id]);


  return (
    <div className="relative min-h-screen pb-20">
      {/* Hero Backdrop */}
      <div className="relative w-full h-[55vh] min-h-[420px] overflow-hidden">
        <img
          src={event.backdropImage}
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
                src={event.posterImage}
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
                  navigator.clipboard.writeText(window.location.href);
                  alert('Event link copied to clipboard!');
                }}
                className="py-2.5 px-4 rounded-xl border border-white/10 bg-white/5 text-neutral-300 hover:border-white/20 flex items-center justify-center transition-colors cursor-pointer"
                title="Share Event"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-end pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="gold">LIVE EXPERIENCE</Badge>
              <span className="text-xs text-neutral-400">Date: {event.scheduleStatus} • Axiata Arena KL</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-heading font-black text-white tracking-tight mb-3">
              {event.title}
            </h1>

            {/* Rating and formats */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <Rating score={event.rating} />
              <span className="text-sm font-semibold text-[#f5a623]">
                {event.rating} / 5.0
              </span>
              <span className="text-xs text-neutral-400">|</span>
              <span className="text-xs text-neutral-300 font-medium">
                {event.genre}
              </span>
              <div className="flex items-center gap-1.5">
                {event.formats.map((fmt) => (
                  <Badge key={fmt} variant="outline">
                    {fmt}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Synopsis */}
            <div className="mb-8 max-w-3xl">
              <h3 className="text-sm uppercase font-semibold tracking-wider text-neutral-400 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#f5a623]" />
                Event Highlights
              </h3>
              <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
                {event.description}
              </p>
            </div>

            {/* Booking action bar */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl">
              <div>
                <div className="text-xs text-neutral-400 flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-[#f5a623]" />
                  <span>Early Bird Tickets Selling Fast</span>
                </div>
                <div className="text-xs text-neutral-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span>National Stadium Bukit Jalil & Mega Star Arena</span>
                </div>
              </div>

              <PrimaryButton onClick={() => setIsBookingOpen(true)}>
                Book Passes
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
