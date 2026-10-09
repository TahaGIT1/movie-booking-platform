import React from 'react';
import type { MediaItem } from '../types';

interface MovieCardProps {
  item: MediaItem;
  isSelected?: boolean;
  onClick?: () => void;
  headerBadge?: string;
  scheduleMarker?: string;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  item,
  isSelected = false,
  onClick,
  headerBadge,
  scheduleMarker,
}) => {
  return (
    <div className="flex flex-col items-start select-none">
      {/* Header bar above card: number + optional schedule marker / category badge */}
      <div className="w-full flex items-center justify-between h-7 px-1 mb-2">
        <div className="flex items-center gap-2">
          {headerBadge && isSelected && (
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-white/10 border border-white/15 text-white/90">
              {headerBadge}
            </span>
          )}
          <span className="text-xs font-mono font-medium text-neutral-400">
            {item.indexNumber}
          </span>
        </div>

        {scheduleMarker && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>{scheduleMarker}</span>
          </div>
        )}
      </div>

      {/* Card container */}
      <div
        onClick={onClick}
        className={`group relative w-36 sm:w-44 md:w-48 lg:w-52 aspect-[2/3] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform bg-[#12151c] ${
          isSelected
            ? 'ring-2 ring-[#f5a623] shadow-[0_0_25px_rgba(245,166,35,0.35)] scale-[1.02]'
            : 'border border-white/10 hover:border-white/30 hover:scale-[1.02] shadow-lg opacity-85 hover:opacity-100'
        }`}
      >
        {/* Card Poster Image */}
        <img
          src={item.posterImage}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80`;
          }}
        />

        {/* Top-Right Status Badge */}
        {item.badgeTopRight && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/70 backdrop-blur-md border border-white/20 text-white shadow-sm">
              {item.badgeTopRight}
            </span>
          </div>
        )}

        {/* Bottom Gradient Overlay & Title */}
        <div className="absolute inset-x-0 bottom-0 pt-16 pb-3 px-3 bg-gradient-to-t from-black via-black/70 to-transparent flex flex-col justify-end">
          <h3 className="text-white font-heading font-semibold text-xs sm:text-sm tracking-wide line-clamp-1 group-hover:text-[#f5a623] transition-colors">
            {item.title}
          </h3>
          <p className="text-[10px] text-neutral-400 capitalize mt-0.5 line-clamp-1">
            {item.genre.split(',')[0]}
          </p>
        </div>

        {/* Subtle highlight sheen */}
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none" />
      </div>
    </div>
  );
};
