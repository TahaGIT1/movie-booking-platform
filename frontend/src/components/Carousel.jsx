import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';

export const Carousel = ({ items, selectedIndex, onSelect, headerBadge, scheduleMarker, className = '', }) => {
    const scrollContainerRef = useRef(null);
    const cardRefs = useRef([]);
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const scrollLeftRef = useRef(0);
    const hasDraggedRef = useRef(false);

    // Auto-scroll selected card smoothly into view / centered whenever selectedIndex changes
    useEffect(() => {
        const target = cardRefs.current[selectedIndex];
        const container = scrollContainerRef.current;
        if (target && container) {
            const containerRect = container.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();

            // Distance from container center to target card center
            const targetCenter = targetRect.left + targetRect.width / 2;
            const containerCenter = containerRect.left + containerRect.width / 2;
            const diff = targetCenter - containerCenter;

            if (Math.abs(diff) > 2) {
                container.scrollTo({
                    left: container.scrollLeft + diff,
                    behavior: 'smooth',
                });
            }
        }
    }, [selectedIndex]);

    const handlePrev = () => {
        onSelect((selectedIndex - 1 + items.length) % items.length);
    };

    const handleNext = () => {
        onSelect((selectedIndex + 1) % items.length);
    };

    const handleMouseDown = (e) => {
        if (!scrollContainerRef.current) return;
        isDraggingRef.current = true;
        hasDraggedRef.current = false;
        startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
        scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    };

    const handleMouseMove = (e) => {
        if (!isDraggingRef.current || !scrollContainerRef.current) return;
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startXRef.current) * 1.5;
        if (Math.abs(walk) > 4) {
            hasDraggedRef.current = true;
        }
        scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
    };

    return (<div className={`flex flex-col items-center w-full select-none ${className}`}>
      {/* Horizontal Cards Row */}
      <div 
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex items-end gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-4 pt-1 px-2 no-scrollbar max-w-full w-full cursor-grab active:cursor-grabbing overscroll-x-contain touch-pan-y"
      >
        {items.map((item, index) => {
            const isSelected = index === selectedIndex;
            const showMarker = index === 2 ? scheduleMarker : undefined;
            return (
              <MovieCard 
                key={item.id} 
                ref={(el) => (cardRefs.current[index] = el)}
                item={item} 
                isSelected={isSelected} 
                onClick={() => {
                  if (!hasDraggedRef.current) onSelect(index);
                }} 
                headerBadge={headerBadge} 
                scheduleMarker={showMarker}
              />
            );
        })}
      </div>

      {/* Navigation Controls: Custom Progress Indicator + Arrows */}
      <div className="w-full flex items-center justify-between gap-4 mt-3 px-2">
        <div className="flex-1 max-w-[200px] sm:max-w-xs h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#f5a623] to-[#ffd166] rounded-full transition-transform duration-300 ease-out"
            style={{
              width: `${100 / Math.max(1, items.length)}%`,
              transform: `translateX(${selectedIndex * 100}%)`,
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handlePrev} aria-label="Previous item" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/20 bg-black/50 hover:bg-white/15 active:bg-white/25 text-white/90 flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer hover:border-white/40">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 -ml-0.5"/>
          </button>

          <button onClick={handleNext} aria-label="Next item" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/20 bg-black/50 hover:bg-white/15 active:bg-white/25 text-white/90 flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer hover:border-white/40">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 -mr-0.5"/>
          </button>
        </div>
      </div>
    </div>);
};

