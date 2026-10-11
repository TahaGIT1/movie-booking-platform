import React from 'react';
import { Star } from 'lucide-react';
export const Rating = ({ score = 4.5, maxStars = 5, className = '', }) => {
    // `role="img"` is required for the label to be announced: aria-label on a
    // generic <div> is ignored by most screen readers, which left every rating
    // in the app completely silent. The stars are decorative on top of that.
    return (<div className={`flex items-center gap-1 ${className}`} role="img" aria-label={`Rating: ${score} out of ${maxStars} stars`}>
      {Array.from({ length: maxStars }).map((_, index) => {
            const starValue = index + 1;
            const isFull = score >= starValue;
            const isHalf = !isFull && score >= starValue - 0.5;
            return (<span key={index} aria-hidden="true" className="relative inline-block text-[#f5a623]">
            {isFull ? (<Star className="w-4 h-4 fill-[#f5a623] text-[#f5a623]"/>) : isHalf ? (<div className="relative">
                <Star className="w-4 h-4 text-white/30"/>
                <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
                  <Star className="w-4 h-4 fill-[#f5a623] text-[#f5a623]"/>
                </div>
              </div>) : (<Star className="w-4 h-4 text-white/30"/>)}
          </span>);
        })}
    </div>);
};
