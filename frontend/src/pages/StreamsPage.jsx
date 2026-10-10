import React, { useState, useEffect } from 'react';
import { HeroSection } from '../components/HeroSection';
import { api } from '../services/api';
import { Play, Star } from 'lucide-react';

export const StreamsPage = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getStreams().then((data) => {
      if (isMounted) {
        setStreams(Array.isArray(data) ? data : []);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setStreams([]);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const heroConfig = {
    pageType: 'streams',
    statusLabelLeft: 'Online digital release',
    statusSubLeft: 'Exclusive 4K HDR digital premiere',
    genres: ['Fantasy', 'Drama', 'Action', 'Sci-Fi'],
    statusToggle: {
      activeOption: 'Streaming Now',
      secondaryOption: 'Coming Soon',
    },
    items: streams.slice(0, 4),
  };

  return (
    <main className="w-full">
      {/* 1. PRIMARY FIGMA REFERENCE HERO SECTION */}
      {streams.length > 0 && <HeroSection config={heroConfig} />}

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

        {streams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {streams.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col rounded-2xl overflow-hidden bg-[#11131c] border border-white/10 hover:border-[#f5a623]/60 transition-all duration-300 hover:-translate-y-1 shadow-xl"
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
                  <img
                    src={item.posterImage || '/images/movies/the-batman.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/80 backdrop-blur-md border border-white/20 text-white">
                      {item.badgeTopRight || 'Digital'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-[#f5a623] font-semibold mb-1.5">
                      <Star className="w-3.5 h-3.5 fill-[#f5a623]" />
                      <span>{item.rating || '4.8'}</span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-neutral-400">{item.genre || 'Stream'}</span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-white mb-2 line-clamp-1 group-hover:text-[#f5a623] transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                        Watch Online
                      </span>
                      <span className="text-sm font-bold text-white">
                        {item.tagline || 'Original'}
                      </span>
                    </div>

                    <button className="px-3.5 py-1.5 rounded-xl bg-[#f5a623] hover:bg-[#d48b17] text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#f5a623]/20">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading ? (
          <div className="p-12 text-center rounded-2xl bg-[#11131c] border border-white/10">
            <div className="text-3xl mb-3">📺</div>
            <h3 className="text-lg font-bold text-white mb-1">No Streams Found in Database</h3>
            <p className="text-xs text-neutral-400">There are currently no digital releases available to stream.</p>
          </div>
        ) : null}
      </section>
    </main>
  );
};
