import React, { useState, useEffect } from 'react';
import { HeroSection } from '../components/HeroSection';
import { streamsData } from '../data/streams';
import { api } from '../services/api';
import type { HeroConfig, MediaItem } from '../types';
import { Play, Star } from 'lucide-react';

export const StreamsPage: React.FC = () => {
  const [streams, setStreams] = useState<MediaItem[]>(streamsData);

  useEffect(() => {
    let isMounted = true;
    api.getStreams().then((data) => {
      if (isMounted && data?.length > 0) setStreams(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Exact Figma Hero Reference configuration
  const heroConfig: HeroConfig = {
    pageType: 'streams',
    statusLabelLeft: 'Online digital release',
    statusSubLeft: 'Exclusive 4K HDR digital premiere',
    genres: ['Fantasy', 'Drama', 'Action', 'Sci-Fi'],
    statusToggle: {
      activeOption: 'Streaming Now',
      secondaryOption: 'Coming Soon',
    },
    items: streams,
  };


  return (
    <main className="w-full">
      {/* 1. PRIMARY FIGMA REFERENCE HERO SECTION */}
      <HeroSection config={heroConfig} />

      {/* 2. SCROLLABLE DIGITAL RELEASES & SERIES GRID */}
      <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30 mb-2 inline-block">
              PREMIER DIGITAL RELEASES
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
              Trending Series & Digital Premieres
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Stream in ultra-high bitrate 4K HDR with Dolby Vision and Dolby Atmos on your home theatre.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {streams.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col rounded-2xl overflow-hidden bg-[#11131c] border border-white/10 hover:border-[#f5a623]/60 transition-all duration-300 hover:-translate-y-1 shadow-xl"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                <img
                  src={item.posterImage}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/80 backdrop-blur-md border border-white/20 text-white">
                    {item.badgeTopRight}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#f5a623] text-black">
                    4K HDR
                  </span>
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#f5a623] text-black flex items-center justify-center shadow-xl shadow-[#f5a623]/40 transform scale-75 group-hover:scale-100 transition-transform">
                    <Play className="w-6 h-6 fill-black ml-0.5" />
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[11px] text-neutral-400">{item.genre}</span>
                    <div className="flex items-center gap-1 text-[#f5a623] font-semibold text-xs">
                      <Star className="w-3 h-3 fill-[#f5a623]" />
                      <span>{item.rating}</span>
                    </div>
                  </div>

                  <h3 className="font-heading font-bold text-white text-base leading-snug group-hover:text-[#f5a623] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-neutral-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-mono">
                    Ultra HD 4K
                  </span>

                  <button
                    onClick={() => alert(`Starting 4K stream for ${item.title}`)}
                    className="px-4 py-2 rounded-xl bg-[#f5a623] hover:bg-[#e09612] text-black font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#f5a623]/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-black" />
                    <span>Watch Now</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
