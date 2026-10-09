import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MediaItem } from '../types';
import { MovieCard } from './MovieCard';

interface CarouselProps {
  items: MediaItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  headerBadge?: string;
  scheduleMarker?: string;
  className?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  items,
  selectedIndex,
  onSelect,
  headerBadge,
  scheduleMarker,
  className = '',
}) => {
  const handlePrev = () => {
    onSelect((selectedIndex - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    onSelect((selectedIndex + 1) % items.length);
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Horizontal Cards Row */}
      <div className="flex items-end gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-4 pt-1 px-2 no-scrollbar max-w-full">
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          const showMarker = index === 2 ? scheduleMarker : undefined;

          return (
            <MovieCard
              key={item.id}
              item={item}
              isSelected={isSelected}
              onClick={() => onSelect(index)}
              headerBadge={headerBadge}
              scheduleMarker={showMarker}
            />
          );
        })}
      </div>

      {/* Navigation Arrow Controls: Circular buttons centered beneath the cards */}
      <div className="flex items-center gap-3 mt-2 sm:mt-3">
        <button
          onClick={handlePrev}
          aria-label="Previous item"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/20 bg-black/50 hover:bg-white/15 active:bg-white/25 text-white/90 flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer hover:border-white/40"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 -ml-0.5" />
        </button>

        <button
          onClick={handleNext}
          aria-label="Next item"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/20 bg-black/50 hover:bg-white/15 active:bg-white/25 text-white/90 flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer hover:border-white/40"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 -mr-0.5" />
        </button>
      </div>
    </div>
  );
};
