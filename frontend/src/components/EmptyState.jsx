import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, WifiOff, MapPin } from 'lucide-react';
import { ACTIVE_CITY_LABEL } from '../constants/locations';

/**
 * Shared empty / "nothing here yet" panel.
 *
 * Every discovery section (Movies, Streams, Events, Plays, Sports, Activities)
 * used to hand-roll its own empty markup, and most of them were unreachable
 * because the API layer substituted fallback data for empty responses. This
 * component gives all of them one consistent "upcoming" treatment instead of
 * a bare void.
 *
 * Props:
 *   icon      - lucide icon component
 *   title     - headline, e.g. "No upcoming events"
 *   message   - supporting sentence
 *   city      - when true, names the active city in the message
 *   variant   - 'upcoming' (default) | 'offline'
 *   action    - optional { label, to } rendered as a link
 */

const VARIANTS = {
  upcoming: {
    Icon: CalendarClock,
    accent: 'text-[#f5a623]',
    glow: 'bg-[#f5a623]/15 border-[#f5a623]/30',
    pill: 'bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/25',
    pillText: 'Coming Soon',
  },
  offline: {
    Icon: WifiOff,
    accent: 'text-neutral-400',
    glow: 'bg-white/5 border-white/10',
    pill: 'bg-white/5 text-neutral-400 border-white/10',
    pillText: 'Offline',
  },
};

export const EmptyState = ({
  icon,
  title,
  message,
  city = true,
  variant = 'upcoming',
  action,
  className = '',
}) => {
  const config = VARIANTS[variant] || VARIANTS.upcoming;
  const Icon = icon || config.Icon;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#11131c] border border-white/10 px-6 py-14 sm:py-20 text-center ${className}`}
    >
      {/* Soft accent wash so the panel reads as designed rather than broken. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[#f5a623]/5 blur-3xl"
      />

      <div className="relative flex flex-col items-center">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${config.glow}`}
        >
          <Icon className={`h-7 w-7 ${config.accent}`} />
        </div>

        <span
          className={`mt-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${config.pill}`}
        >
          {config.pillText}
        </span>

        <h3 className="mt-3 font-heading text-xl font-black text-white sm:text-2xl">
          {title}
        </h3>

        {message && (
          <p className="mt-2 max-w-md text-xs leading-relaxed text-neutral-400 sm:text-sm">
            {message}
          </p>
        )}

        {city && (
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-neutral-300">
            <MapPin className="h-3.5 w-3.5 text-[#f5a623]" />
            Showing listings for {ACTIVE_CITY_LABEL}
          </p>
        )}

        {action?.to && (
          <Link
            to={action.to}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f5a623] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e09612]"
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
};

export default EmptyState;