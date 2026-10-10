import React, { useState } from 'react';
import { Star, Ticket, Clock, Info, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
export const NowShowingGrid = ({
    items,
    onBook,
    onWatchTrailer,
    title = 'Now Showing in Cinemas',
    subtitle = 'Discover what’s lighting up screens across major cinemas this week.',
    activeTab = 'now',
    onTabChange,
}) => {
    const [selectedFormat, setSelectedFormat] = useState('All');
    const formats = ['All', 'IMAX', '3D', 'Dolby Atmos', '4DX'];
    const filteredItems = items.filter((item) => {
        if (selectedFormat === 'All')
            return true;
        const itemFormats = Array.isArray(item.formats) ? item.formats : [];
        return itemFormats.some((f) => f.toLowerCase().includes(selectedFormat.toLowerCase()));
    });
    return (<section className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
      {/* Header, category tabs and format filter tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30 inline-block">
              TMDB LIVE CATALOG
            </span>
            {onTabChange && (
              <div className="inline-flex rounded-full bg-white/5 border border-white/10 p-0.5 text-xs font-semibold">
                <button
                  onClick={() => onTabChange('now')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    activeTab === 'now'
                      ? 'bg-[#f5a623] text-black shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Now Showing
                </button>
                <button
                  onClick={() => onTabChange('upcoming')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    activeTab === 'upcoming'
                      ? 'bg-[#f5a623] text-black shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Coming Soon
                </button>
                <button
                  onClick={() => onTabChange('trending')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    activeTab === 'trending'
                      ? 'bg-[#f5a623] text-black shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Trending
                </button>
              </div>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            {subtitle}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {formats.map((fmt) => (<button key={fmt} onClick={() => setSelectedFormat(fmt)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${selectedFormat === fmt
                ? 'bg-[#f5a623] text-black shadow-md shadow-[#f5a623]/20'
                : 'bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:border-white/25'}`}>
              {fmt}
            </button>))}
        </div>
      </div>


      {/* Grid of Posters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
        {filteredItems.map((item) => (<div key={item.id} className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#11131c] border border-white/10 hover:border-[#f5a623]/60 transition-all duration-300 hover:-translate-y-1 shadow-xl">
            {/* Poster Image Container */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-900">
              <img src={item.posterImage} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onError={(e) => {
                e.target.src =
                    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=80';
            }}/>

              {/* Status / Badge */}
              <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5 items-end">
                {item.badgeTopRight && (<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/75 backdrop-blur-md border border-white/20 text-white shadow-md">
                    {item.badgeTopRight}
                  </span>)}
                {item.formats[0] && (<span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#f5a623]/90 text-black shadow-md">
                    {item.formats[0]}
                  </span>)}
              </div>

              {/* Quick Actions Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-[11px] text-neutral-300 line-clamp-3 mb-3">
                  {item.description}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => onBook(item)} className="flex-1 py-2 rounded-xl bg-[#f5a623] hover:bg-[#e09612] text-black font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#f5a623]/25 cursor-pointer">
                    <Ticket className="w-3.5 h-3.5"/>
                    <span>Book Now</span>
                  </button>
                  {onWatchTrailer && (<button onClick={() => onWatchTrailer(item)} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm cursor-pointer" title="Watch Trailer">
                      <Play className="w-3.5 h-3.5 fill-white"/>
                    </button>)}
                  <Link to={`/movie/${item.id}`} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm cursor-pointer" title="View Details">
                    <Info className="w-3.5 h-3.5"/>
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] text-neutral-400 capitalize truncate">
                    {item.genre}
                  </span>
                  <div className="flex items-center gap-1 text-[#f5a623] font-semibold text-xs shrink-0">
                    <Star className="w-3.5 h-3.5 fill-[#f5a623]"/>
                    <span>{item.rating}</span>
                  </div>
                </div>

                <Link to={`/movie/${item.id}`} className="font-heading font-bold text-white text-sm sm:text-base leading-snug hover:text-[#f5a623] transition-colors line-clamp-1">
                  {item.title}
                </Link>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-500"/>
                  {item.duration || '2h 20m'}
                </span>
                <span className="font-semibold text-white">
                  From RM {item.priceRM || 22}
                </span>
              </div>
            </div>
          </div>))}
      </div>
    </section>);
};
