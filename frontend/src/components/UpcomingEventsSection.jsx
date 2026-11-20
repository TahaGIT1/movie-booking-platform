import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Music, 
  Smile, 
  Theater, 
  Radio, 
  ExternalLink,
  Compass
} from 'lucide-react';

const INDIAN_CITIES = [
  { id: 'all', name: 'All India', label: 'All India' },
  { id: 'Delhi', name: 'Delhi NCR', label: 'Delhi NCR' },
  { id: 'Mumbai', name: 'Mumbai', label: 'Mumbai' },
  { id: 'Bengaluru', name: 'Bengaluru', label: 'Bengaluru' },
  { id: 'Belagavi', name: 'Belagavi', label: 'Belagavi' },
  { id: 'Pune', name: 'Pune', label: 'Pune' },
  { id: 'Goa', name: 'Goa', label: 'Goa' },
  { id: 'Hyderabad', name: 'Hyderabad', label: 'Hyderabad' },
  { id: 'Kolkata', name: 'Kolkata', label: 'Kolkata' },
  { id: 'Chennai', name: 'Chennai', label: 'Chennai' },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'comedy', label: 'Comedy (Laugh Out Loud)', icon: Smile },
  { id: 'music', label: 'Music & Concerts', icon: Music },
  { id: 'festivals', label: 'Festivals & Nightlife', icon: Radio },
  { id: 'theatre', label: 'Theatre & Arts', icon: Theater },
];

/**
 * Single Event Card with Hover Video Preview & Poster Fallback
 * Only loads/plays video on hover to prevent CPU/GPU saturation from dozens of simultaneous video decoders.
 */
const EventCard = ({ event }) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (isHovered && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    } else if (!isHovered && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isHovered]);

  const bookingLink = event.ticketUrl || event.primaryAction?.link || `/events/${event.id}`;
  const isExternal = Boolean(event.ticketUrl || event.primaryAction?.external);

  // Format date display
  const displayDate = event.dateLabel || event.date || 'Upcoming';

  const getEventPoster = (ev) => {
    const raw = ev.posterImage || ev.backdropImage;
    const isBad = !raw || 
      typeof raw !== 'string' || 
      raw.includes('o2_assets') || 
      raw.includes('edition_assets') || 
      raw.includes('7578f6353195a792b3526f691287be4a1742904947') ||
      raw.includes('fb7a705e0ecb73494655f6a082a898be1742905087') ||
      raw.includes('c14de0ff254f0cac2316900cbeb5ca4e1742906714') ||
      raw.includes('21ebc1fe6df75df6159d00e9ab651d681742906748');

    if (!isBad) return raw;

    const cat = (ev.category || '').toLowerCase();
    const title = (ev.title || '').toLowerCase();

    if (title.includes('samay') || title.includes('raina') || title.includes('zeroo') || title.includes('kapruwan')) {
      return 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80';
    }
    if (title.includes('zakir')) {
      return 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80';
    }
    if (title.includes('bassi') || title.includes('kenny') || title.includes('kanan')) {
      return 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&auto=format&fit=crop&q=80';
    }
    if (title.includes('hauz khas') || title.includes('south delhi') || title.includes('vyatha') || title.includes('lineup')) {
      return 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80';
    }
    if (title.includes('diljit') || title.includes('arijit') || title.includes('kuhad') || title.includes('divine')) {
      return 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80';
    }
    if (title.includes('sunburn') || title.includes('hilltop') || cat.includes('festival')) {
      return 'https://images.unsplash.com/photo-1468359601543-843bfaef291a?w=800&auto=format&fit=crop&q=80';
    }
    if (cat.includes('theatre') || cat.includes('art')) {
      return 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&auto=format&fit=crop&q=80';
    }
    if (cat.includes('music') || cat.includes('concert')) {
      return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';
    }

    return 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80';
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex-none w-[280px] sm:w-[320px] md:w-[340px] flex flex-col rounded-2xl overflow-hidden bg-[#11131c] border border-white/10 hover:border-[#f5a623]/60 transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-[#f5a623]/10"
    >
      {/* Media Container: 16:10 Ratio */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-900 select-none">
        {isHovered && event.videoUrl ? (
          <video
            ref={videoRef}
            src={event.videoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            className="w-full h-full object-cover transition-transform duration-500 scale-105"
          />
        ) : (
          <img
            src={getEventPoster(event)}
            alt={event.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80';
            }}
          />
        )}

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#11131c] via-black/25 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-black/80 backdrop-blur-md border border-[#f5a623]/40 text-[#f5a623] shadow-md">
            {event.categoryLabel || event.category?.toUpperCase() || 'LIVE EVENT'}
          </span>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/80 backdrop-blur-md border border-white/15 text-neutral-200 flex items-center gap-1 shadow-md">
            <Calendar className="w-3 h-3 text-[#f5a623]" />
            <span className="truncate max-w-[120px]">{displayDate.split(',')[0]}</span>
          </span>
        </div>

        {/* Live video indicator pill */}
        {event.videoUrl && (
          <div className="absolute bottom-2.5 left-3 pointer-events-none z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-emerald-500/30 text-[9px] font-bold text-emerald-400">
            <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${isHovered ? 'animate-pulse' : ''}`} />
            <span>{isHovered ? 'LIVE PREVIEW' : 'HOVER TO PREVIEW'}</span>
          </div>
        )}
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="font-heading font-black text-base sm:text-lg text-white mb-2 line-clamp-2 leading-snug group-hover:text-[#f5a623] transition-colors">
            {event.title}
          </h3>

          {/* Venue & City */}
          <div className="flex items-start gap-1.5 text-xs text-neutral-400 mb-2">
            <MapPin className="w-3.5 h-3.5 text-[#f5a623] shrink-0 mt-0.5" />
            <span className="line-clamp-1">{event.venue || event.city}</span>
          </div>

          {/* Schedule / Date Line */}
          <div className="text-[11px] font-medium text-neutral-400 mb-3 line-clamp-1">
            {displayDate}
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase font-semibold block leading-tight">
              Passes
            </span>
            <span className="text-xs sm:text-sm font-black text-[#f5a623]">
              {event.price || '₹299 onwards'}
            </span>
          </div>

          {isExternal ? (
            <a
              href={bookingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e08e0b] hover:from-[#e08e0b] hover:to-[#c77a06] text-black text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-[#f5a623]/20 hover:scale-[1.03] active:scale-95 cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Buy Tickets</span>
              <ExternalLink className="w-3 h-3 opacity-75" />
            </a>
          ) : (
            <Link
              to={bookingLink}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-[#e08e0b] hover:from-[#e08e0b] hover:to-[#c77a06] text-black text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-[#f5a623]/20 hover:scale-[1.03] active:scale-95 cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Buy Tickets</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export const UpcomingEventsSection = () => {
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const scrollContainerRef = useRef(null);
  const isMouseDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Update scroll navigation states (canScrollLeft, canScrollRight, progress) without redundant re-renders
  const updateScrollState = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const newLeft = scrollLeft > 20;
    const newRight = scrollLeft < scrollWidth - clientWidth - 20;
    setCanScrollLeft((prev) => (prev !== newLeft ? newLeft : prev));
    setCanScrollRight((prev) => (prev !== newRight ? newRight : prev));
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      const newProgress = Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100));
      setScrollProgress((prev) => (Math.abs(prev - newProgress) > 2 ? newProgress : prev));
    } else {
      setScrollProgress(100);
    }
  };

  // Fetch live Indian District & Ticketmaster events based on city and category
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const queryParams = {};
    if (selectedCity !== 'all') {
      queryParams.city = selectedCity;
    }
    if (selectedCategory !== 'all') {
      queryParams.category = selectedCategory;
    }

    api
      .getEvents(queryParams)
      .then((data) => {
        if (isMounted) {
          const list = Array.isArray(data) ? data : [];
          setEvents(list);
          setLoading(false);
          setTimeout(updateScrollState, 150);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('[UpcomingEvents] Error fetching events:', err);
          setError('Failed to fetch events from Ticketmaster.');
          setEvents([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCity, selectedCategory]);

  // Click & Drag-to-Scroll Handlers
  const handleMouseDown = (e) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isMouseDownRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      updateScrollState();
    }
  };

  const handleMouseLeave = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      updateScrollState();
    }
  };

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const offset = direction === 'left' ? -420 : 420;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(updateScrollState, 350);
  };

  const currentCityObj = INDIAN_CITIES.find((c) => c.id === selectedCity) || INDIAN_CITIES[0];

  return (
    <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
      {/* 1. Header Inspired by District by Zomato with Black & Gold Theme */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30 inline-flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-[#f5a623]" />
              DISTRICT LIVE • INDIA
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-white/5 text-neutral-400 border border-white/10 hidden sm:inline-block">
              LAUGH OUT LOUD & SHOWS
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden md:inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE TICKETING
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-white tracking-tight">
            Upcoming Shows & Comedy in {selectedCity === 'all' ? 'India' : currentCityObj.label}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
            Discover verified live stand-up comedy specials, arena music concerts, and festivals across Indian cities.
          </p>
        </div>

        {/* View All Events Link + Carousel Arrows */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <Link
            to="/events"
            className="text-xs sm:text-sm font-bold text-[#f5a623] hover:text-[#ffbe42] transition-colors flex items-center gap-1 group py-1.5 px-3.5 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/25 hover:border-[#f5a623]/50 cursor-pointer shadow-sm"
          >
            <span>View All Events</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="p-2 rounded-xl bg-white/5 hover:bg-[#f5a623] hover:text-black border border-white/10 hover:border-[#f5a623] text-white transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="p-2 rounded-xl bg-white/5 hover:bg-[#f5a623] hover:text-black border border-white/10 hover:border-[#f5a623] text-white transition-all cursor-pointer active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. City Filter Pills (District Style) */}
      <div className="mb-4 overflow-x-auto scrollbar-none pb-2">
        <div className="flex items-center gap-2 min-w-max">
          <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1 mr-1">
            <MapPin className="w-3.5 h-3.5 text-[#f5a623]" />
            <span>City:</span>
          </span>
          {INDIAN_CITIES.map((city) => {
            const isSelected = selectedCity === city.id;
            return (
              <button
                key={city.id}
                onClick={() => setSelectedCity(city.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#f5a623] text-black shadow-md shadow-[#f5a623]/25 scale-105'
                    : 'bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {city.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Category Filter Pills */}
      <div className="mb-6 overflow-x-auto scrollbar-none pb-1">
        <div className="flex items-center gap-2 min-w-max">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-white/20 text-white border border-[#f5a623]/60'
                    : 'bg-white/5 text-neutral-400 hover:text-neutral-200 border border-white/5 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#f5a623]' : 'text-neutral-500'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Carousel Container with Floating Edge Arrows */}
      <div className="relative group/carousel">
        {/* Floating Left Chevron Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            aria-label="Previous events"
            className="hidden md:flex absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center rounded-full bg-black/85 hover:bg-[#f5a623] hover:text-black text-white border border-[#f5a623]/40 hover:border-[#f5a623] shadow-2xl backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}

        {/* Floating Right Chevron Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            aria-label="Next events"
            className="hidden md:flex absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center rounded-full bg-black/85 hover:bg-[#f5a623] hover:text-black text-white border border-[#f5a623]/40 hover:border-[#f5a623] shadow-2xl backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}

        {/* Card List / Loading Skeleton */}
        {loading ? (
          /* Loading Skeleton */
          <div className="flex gap-5 sm:gap-6 overflow-x-hidden pb-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex-none w-[280px] sm:w-[320px] md:w-[340px] rounded-2xl bg-[#11131c] border border-white/10 overflow-hidden animate-pulse"
              >
                <div className="aspect-[16/10] bg-white/5" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="pt-3 border-t border-white/10 flex justify-between">
                    <div className="h-4 bg-white/10 rounded w-1/4" />
                    <div className="h-8 bg-white/10 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          /* Real Horizontal Carousel with Drag & Mouse Wheel Support */
          <div
            ref={scrollContainerRef}
            onScroll={updateScrollState}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className="flex gap-5 sm:gap-6 overflow-x-auto pb-4 px-1 pr-16 sm:pr-24 lg:pr-32 select-none cursor-grab active:cursor-grabbing overscroll-x-contain touch-pan-y"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#f5a623 #11131c',
            }}
          >
            {events.map((event) => (
              <div key={event.id || event.ticketmasterId} className="flex-none">
                <EventCard event={event} />
              </div>
            ))}

            {/* Trailing spacer to ensure the last card ("Insaan Ki Vyatha...") has full breathing room and is never cut off */}
            <div className="flex-none w-12 sm:w-20" aria-hidden="true" />
          </div>
        ) : (
          /* 5. Clean Empty State */
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#11131c] to-[#0c0d14] border border-white/10 text-center max-w-3xl mx-auto shadow-2xl">
            <div className="inline-flex p-4 rounded-2xl bg-[#f5a623]/10 border border-[#f5a623]/25 mb-4 text-[#f5a623]">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-black text-white mb-2">
              No Upcoming Events Found in {currentCityObj.label}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed mb-6">
              There are currently no active live listings scheduled specifically for{' '}
              <strong className="text-neutral-200">{currentCityObj.label}</strong> in this category. You can explore all live shows and specials across India.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedCity('all');
                  setSelectedCategory('all');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#f5a623] hover:bg-[#d48b17] text-black text-xs font-black transition-all shadow-lg shadow-[#f5a623]/20 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explore All Live Events</span>
              </button>
              <Link
                to="/events"
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                Go to Events Directory
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 5. Status / Progress Track at Bottom */}
      {!loading && events.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 border-t border-white/5 pt-3">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="px-2 py-0.5 rounded bg-[#f5a623]/20 text-[#f5a623] font-black text-[11px]">
              {events.length} SHOWS
            </span>
            <span>Available across India with live looping previews</span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-[11px] text-neutral-500 font-medium hidden sm:inline">
              Scroll or drag to explore
            </span>
            <div className="w-32 sm:w-44 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#f5a623] to-[#e08e0b] rounded-full transition-all duration-150"
                style={{ width: `${Math.max(12, scrollProgress)}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-neutral-400 w-8 text-right">
              {Math.round(scrollProgress)}%
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
