import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  score?: number; // 0 to 5, default 4.5
  maxStars?: number;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  score = 4.5,
  maxStars = 5,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label={`Rating: ${score} out of ${maxStars} stars`}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const isFull = score >= starValue;
        const isHalf = !isFull && score >= starValue - 0.5;

        return (
          <span key={index} className="relative inline-block text-[#f5a623]">
            {isFull ? (
              <Star className="w-4 h-4 fill-[#f5a623] text-[#f5a623]" />
            ) : isHalf ? (
              <div className="relative">
                <Star className="w-4 h-4 text-white/30" />
                <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
                  <Star className="w-4 h-4 fill-[#f5a623] text-[#f5a623]" />
                </div>
              </div>
            ) : (
              <Star className="w-4 h-4 text-white/30" />
            )}
          </span>
        );
      })}
    </div>
  );
};
