import React, { useEffect } from 'react';
import { X, Ticket, Volume2, Star } from 'lucide-react';
export const TrailerModal = ({ item, isOpen, onClose, onOpenBooking, }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#11131c] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30 tracking-wider">
              OFFICIAL PREVIEW
            </span>
            <h3 className="text-base sm:text-lg font-heading font-bold text-white truncate max-w-md">
              {item.title} — Official Trailer
            </h3>
          </div>

          <button onClick={onClose} aria-label="Close trailer" className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Video Player Canvas */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
          {(() => {
            let embedUrl = null;
            if (item.trailerKey) {
              embedUrl = `https://www.youtube.com/embed/${item.trailerKey}?autoplay=1`;
            } else if (item.trailerUrl) {
              if (item.trailerUrl.includes('embed/')) {
                embedUrl = item.trailerUrl;
              } else if (item.trailerUrl.includes('watch?v=')) {
                embedUrl = item.trailerUrl.replace('watch?v=', 'embed/') + '?autoplay=1';
              } else if (item.trailerUrl.includes('youtu.be/')) {
                const vidId = item.trailerUrl.split('youtu.be/')[1]?.split('?')[0];
                if (vidId) embedUrl = `https://www.youtube.com/embed/${vidId}?autoplay=1`;
              }
            }

            return embedUrl ? (
              <iframe
                src={embedUrl}
                title={`${item.title} Trailer`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="relative w-full h-full">
                <img
                  src={item.backdropImage || item.posterImage}
                  alt={item.title}
                  className="w-full h-full object-cover brightness-75 scale-105 transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-white font-heading font-bold text-base sm:text-lg drop-shadow">
                    Official Preview Available on YouTube
                  </span>
                  {item.trailerUrl && (
                    <a
                      href={item.trailerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 px-4 py-2 rounded-xl bg-[#f5a623] text-black font-semibold text-xs flex items-center gap-1.5"
                    >
                      Open Trailer on YouTube
                    </a>
                  )}
                </div>
              </div>
            );
          })()}
        </div>


        {/* Bottom Details & Booking Bar */}
        <div className="p-6 bg-[#0c0d14] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center text-[#f5a623] text-xs font-bold gap-1">
                <Star className="w-3.5 h-3.5 fill-[#f5a623]"/>
                <span>{item.rating}</span>
              </div>
              <span className="text-xs text-neutral-500">•</span>
              <span className="text-xs text-neutral-400">{item.genre}</span>
              <span className="text-xs text-neutral-500">•</span>
              <span className="text-xs text-neutral-400">{item.duration || '2h 30m'}</span>
            </div>
            <p className="text-xs text-neutral-300 line-clamp-1 max-w-xl">
              {item.description}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onOpenBooking && item.category !== 'stream' && (<button onClick={() => {
                onClose();
                onOpenBooking(item);
            }} className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#f5a623] hover:bg-[#e09612] text-black font-semibold text-xs transition-all shadow-md shadow-[#f5a623]/25 flex items-center justify-center gap-2 cursor-pointer">
                <Ticket className="w-4 h-4"/>
                <span>Book Tickets Now</span>
              </button>)}
          </div>
        </div>
      </div>
    </div>);
};
