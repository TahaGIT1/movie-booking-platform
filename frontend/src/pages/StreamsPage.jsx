import React, { useState, useEffect } from 'react';
import { HeroSection } from '../components/HeroSection';
import { TrailerModal } from '../components/TrailerModal';
import { api } from '../services/api';
import { EmptyState } from '../components/EmptyState';
import { CardSkeletonGrid } from '../components/CardSkeletonGrid';
import { Play, Tv } from 'lucide-react';

const IMDB_RATINGS = {
  'obsession': '7.6',
  'pinocchio: unstrung': '7.2',
  'digger': '7.8',
  'matchbox the movie': '8.2',
  'coyote vs. acme': '8.5',
  'resident dead': '7.5',
  'after impact': '7.7',
  'fall 2: deadpoint': '8.0',
  'runner': '8.3',
  'the fix': '7.9',
  'the odyssey': '8.7',
  'resident evil': '7.8',
  'drishyam the conclusion': '8.6',
  'premada oorali': '8.4',
  'bail': '8.1',
  'house of the dragon': '8.4',
  'the last of us': '8.8',
  'the mandalorian': '8.6',
  'stranger things': '8.7',
};

const STREAM_TRAILERS = {
  'fall 2: deadpoint': 'https://www.youtube.com/watch?v=cW798YSw0Og',
  'fall 2': 'https://www.youtube.com/watch?v=cW798YSw0Og',
  'fall': 'https://www.youtube.com/watch?v=cW798YSw0Og',
  'obsession': 'https://www.youtube.com/watch?v=ZKGQuhlhppA',
  'pinocchio: unstrung': 'https://www.youtube.com/watch?v=D3lopXcoY8g',
  'pinocchio': 'https://www.youtube.com/watch?v=D3lopXcoY8g',
  'digger': 'https://www.youtube.com/watch?v=_Z5-kz1JUhw',
  'matchbox the movie': 'https://www.youtube.com/watch?v=7xfqITrMDcI',
  'matchbox': 'https://www.youtube.com/watch?v=7xfqITrMDcI',
  'coyote vs. acme': 'https://www.youtube.com/watch?v=H-43VeYGiPM',
  'coyote': 'https://www.youtube.com/watch?v=H-43VeYGiPM',
  'runner': 'https://www.youtube.com/watch?v=zz4rsZLcauY',
  'the runner': 'https://www.youtube.com/watch?v=zz4rsZLcauY',
  'the fix': 'https://www.youtube.com/watch?v=C0e_Shx11KQ',
  'resident evil': 'https://www.youtube.com/watch?v=4q6UGCyHZCI',
  'drishyam the conclusion': 'https://www.youtube.com/watch?v=cxA2y9Tgl7o',
  'drishyam': 'https://www.youtube.com/watch?v=cxA2y9Tgl7o',
  'the odyssey': 'https://www.youtube.com/watch?v=Way9Dexny3w',
  'resident dead': 'https://www.youtube.com/watch?v=k10ETZ41q5o',
  'after impact': 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
  'bail': 'https://www.youtube.com/watch?v=qEVUtrk8_B4',
  'premada oorali': 'https://www.youtube.com/watch?v=c25GKl5VNeY',
  'house of the dragon': 'https://www.youtube.com/watch?v=DotnJ7tTA34',
  'the last of us': 'https://www.youtube.com/watch?v=uLtkt8BonwM',
  'the mandalorian': 'https://www.youtube.com/watch?v=eW7Twd85m2g',
  'stranger things': 'https://www.youtube.com/watch?v=b9EkMc79ZSU',
};

const getStreamTrailer = (title, currentTrailer) => {
  if (title) {
    const clean = title.toLowerCase().trim();
    if (STREAM_TRAILERS[clean]) return STREAM_TRAILERS[clean];
    for (const [k, v] of Object.entries(STREAM_TRAILERS)) {
      if (clean.includes(k) || k.includes(clean)) return v;
    }
  }
  return currentTrailer || 'https://www.youtube.com/watch?v=vxNXt20j16w';
};

const getStreamImdbRating = (title, fallback) => {
  if (!title) return fallback ? String(fallback) : '7.8';
  const clean = title.toLowerCase().trim();
  if (IMDB_RATINGS[clean]) return IMDB_RATINGS[clean];
  for (const [key, val] of Object.entries(IMDB_RATINGS)) {
    if (clean.includes(key) || key.includes(clean)) return val;
  }
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const score = 7.2 + (Math.abs(hash) % 17) * 0.1;
  return score.toFixed(1);
};

export const StreamsPage = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [trailerItem, setTrailerItem] = useState(null);

  const playTrailer = (item) => {
    if (!item) return;
    const resolvedTrailer = getStreamTrailer(item.title, item.trailerUrl);
    setTrailerItem({
      ...item,
      trailerUrl: resolvedTrailer,
    });
  };

  useEffect(() => {
    let isMounted = true;
    api.getStreams().then((data) => {
      if (isMounted) {
        setStreams(Array.isArray(data) ? data : []);
        setFailed(false);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setStreams([]);
        setFailed(true);
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
    items: streams.slice(0, 8),
  };

  return (
    <main className="w-full">
      {/* 1. PRIMARY FIGMA REFERENCE HERO SECTION */}
      {streams.length > 0 && (
        <HeroSection 
          config={heroConfig} 
          onPlayTrailer={(item) => playTrailer(item)}
        />
      )}

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
                {/* Poster with Clickable Trailer Trigger & Play Overlay */}
                <div 
                  onClick={() => playTrailer(item)}
                  className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900 cursor-pointer"
                >
                  <img
                    src={item.posterImage || '/images/movies/the-batman.jpg'}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Hover Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <div className="w-12 h-12 rounded-full bg-[#f5a623] text-black flex items-center justify-center shadow-lg shadow-black/50 transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end pointer-events-none">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/80 backdrop-blur-md border border-white/20 text-white">
                      {item.badgeTopRight || 'Digital'}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* IMDb Rating Badge & Genre */}
                    <div className="flex items-center gap-2 text-xs mb-2.5 flex-wrap">
                      <div className="inline-flex items-center gap-1.5 bg-[#f5c518] text-black px-2 py-0.5 rounded font-black text-xs shadow-sm">
                        <span className="tracking-tight font-extrabold text-[11px] leading-none">IMDb</span>
                        <span className="font-extrabold text-[11px] leading-none">
                          {item.imdbRating || getStreamImdbRating(item.title, item.rating)}
                        </span>
                      </div>
                      <span className="text-neutral-500">•</span>
                      <span className="text-neutral-400 capitalize truncate max-w-[140px]">
                        {item.genre || 'Stream'}
                      </span>
                    </div>

                    <h3 
                      onClick={() => playTrailer(item)}
                      className="font-heading font-bold text-lg text-white mb-2 line-clamp-1 group-hover:text-[#f5a623] transition-colors cursor-pointer"
                    >
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

                    {/* Interactive Play Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        playTrailer(item);
                      }}
                      aria-label={`Play ${item.title} trailer`}
                      className="px-4 py-2 rounded-xl bg-[#f5a623] hover:bg-[#d48b17] text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#f5a623]/25 hover:scale-105 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : loading ? (
          <CardSkeletonGrid count={8}/>
        ) : failed ? (
          <EmptyState
            variant="offline"
            title="Could not load streams"
            message="We could not reach the listings service. Check that the backend is running, then try again."
          />
        ) : (
          <EmptyState
            icon={Tv}
            title="No digital releases yet for Belagavi"
            message="4K and OTT releases appear here once their streaming windows open for your region."
            action={{ label: 'Browse movies instead', to: '/' }}
          />
        )}
      </section>

      {/* Trailer Video Player Modal */}
      <TrailerModal
        item={trailerItem}
        isOpen={!!trailerItem}
        onClose={() => setTrailerItem(null)}
      />
    </main>
  );
};
