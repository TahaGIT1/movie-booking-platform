import React, { useState } from 'react';
import type { HeroConfig, MediaItem } from '../types';
import { Rating } from './Rating';
import { Badge } from './Badge';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { CategoryFilter } from './CategoryFilter';
import { Carousel } from './Carousel';

interface HeroSectionProps {
  config: HeroConfig;
  onOpenBooking?: (item: MediaItem) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ config, onOpenBooking }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState(config.genres[0] || 'All');
  const [statusCategory, setStatusCategory] = useState<'now' | 'upcoming'>('now');

  const currentItem = config.items[selectedIndex] || config.items[0];

  return (
    <div className="relative w-full min-h-[calc(100vh-5rem)] flex flex-col justify-between overflow-hidden">
      {/* Background Image with Cinematic Gradient Overlays */}
      <div className="absolute inset-0 z-0">
        <img
          src={currentItem.backdropImage}
          alt={currentItem.title}
          key={currentItem.backdropImage}
          className="w-full h-full object-cover object-center animate-in fade-in duration-700 transform scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/backgrounds/batman_hero.jpg';
          }}
        />

        {/* Gradients to match Figma reference visual atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0b0e] via-[#0a0b0e]/85 to-transparent/30" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0a0b0e] via-[#0a0b0e]/80 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/80" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 pt-4 sm:pt-8 pb-4 flex-1 flex flex-col justify-between">
        
        {/* Top & Middle Grid: Left Content + Right Carousel */}
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center flex-1 my-auto">
          
          {/* Vertical Accent Text on Far Left (Present on Events design) */}
          {config.verticalAccent && (
            <div className="hidden 2xl:block absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[11px] font-semibold tracking-[0.2em] uppercase text-neutral-500/70 whitespace-nowrap select-none">
              {config.verticalAccent}
            </div>
          )}

          {/* LEFT COLUMN: Featured Item Information */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center max-w-2xl pt-4 lg:pt-0">
            
            {/* Schedule / Status Pin Badge */}
            <div className="flex items-start gap-2.5 mb-3 sm:mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-white mt-1 shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              <div>
                <div className="text-sm sm:text-base font-semibold text-white tracking-wide">
                  {config.statusLabelLeft || currentItem.scheduleStatus}
                </div>
                <div className="text-xs sm:text-sm text-neutral-400">
                  {config.statusSubLeft || currentItem.scheduleLabel || currentItem.tagline || 'Special presentation'}
                </div>
              </div>
            </div>

            {/* Massive Index Number + Title */}
            <div className="flex items-baseline gap-3 sm:gap-4 my-1 sm:my-2">
              <span className="text-5xl sm:text-7xl lg:text-8xl font-heading font-black tracking-tight text-white/95 select-none leading-none">
                {currentItem.indexNumber}
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-bold text-white tracking-tight leading-tight">
                {currentItem.title}
              </h1>
            </div>

            {/* Rating Stars + Genre + Badges Row */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 mb-4">
              <Rating score={currentItem.rating} />
              
              <span className="text-xs sm:text-sm text-neutral-300 font-medium">
                Genre: <span className="text-neutral-400">{currentItem.genre}</span>
              </span>

              <div className="flex items-center gap-1.5">
                {currentItem.formats.map((fmt) => (
                  <Badge key={fmt} variant="outline">
                    {fmt}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Synopsis / Description */}
            <p className="text-xs sm:text-sm md:text-base text-neutral-300 leading-relaxed line-clamp-3 sm:line-clamp-4 mb-6 sm:mb-8 font-normal max-w-xl">
              {currentItem.description}
            </p>

            {/* Action Buttons: Book Now (Gold) + More Info (Dark) */}
            <div className="flex items-center gap-3 sm:gap-4">
              <PrimaryButton
                icon={currentItem.primaryAction.icon || (config.pageType === 'streams' ? 'play' : 'ticket')}
                onClick={() => {
                  if (onOpenBooking && config.pageType !== 'streams') {
                    onOpenBooking(currentItem);
                  }
                }}
                to={config.pageType === 'streams' ? currentItem.primaryAction.link : undefined}
              >
                {currentItem.primaryAction.label}
              </PrimaryButton>

              <SecondaryButton to={currentItem.secondaryAction?.link || `/movie/${currentItem.id}`}>
                {currentItem.secondaryAction?.label || 'More Info'}
              </SecondaryButton>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Movie/Event/Stream Carousel */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-center lg:items-end justify-center w-full">
            <Carousel
              items={config.items}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              headerBadge={currentItem.heroBadge || (config.pageType === 'movies' ? 'BLOCKBUSTER' : 'Watch Now')}
              scheduleMarker={
                config.pageType === 'movies'
                  ? 'Tomorrow'
                  : config.pageType === 'events'
                  ? 'Next Events'
                  : 'Watch Now'
              }
              className="w-full"
            />
          </div>
        </div>

        {/* BOTTOM ROW: Left Category Filter + Right Now Showing / Coming Soon Switcher */}
        <div className="relative z-20 w-full pt-6 sm:pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6">
          <CategoryFilter
            label={config.pageType === 'events' ? undefined : 'Genre'}
            categories={config.genres}
            selectedCategory={selectedGenre}
            onSelectCategory={setSelectedGenre}
          />

          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium self-end sm:self-auto select-none">
            <button
              onClick={() => setStatusCategory('now')}
              className={`transition-colors cursor-pointer ${
                statusCategory === 'now'
                  ? 'text-white font-semibold'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {config.statusToggle.activeOption}
            </button>
            <span className="text-neutral-600 font-light">/</span>
            <button
              onClick={() => setStatusCategory('upcoming')}
              className={`transition-colors cursor-pointer ${
                statusCategory === 'upcoming'
                  ? 'text-white font-semibold'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {config.statusToggle.secondaryOption}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
