import React from 'react';

/**
 * Placeholder grid shown while a discovery section is fetching.
 *
 * The category pages tracked a `loading` flag but rendered `null` for it, so
 * users saw a header followed by a blank void during every load. This keeps
 * the layout stable instead.
 */

export const CardSkeletonGrid = ({ count = 8, className = '' }) => (
  <div
    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}
    aria-hidden="true"
  >
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className="flex flex-col overflow-hidden rounded-2xl bg-[#11131c] border border-white/10"
      >
        <div className="aspect-[2/3] w-full animate-pulse bg-white/5" />
        <div className="space-y-3 p-5">
          <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-full animate-pulse rounded bg-white/5" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-white/5" />
          <div className="flex items-center justify-between pt-3">
            <div className="h-5 w-16 animate-pulse rounded bg-white/10" />
            <div className="h-8 w-20 animate-pulse rounded-xl bg-white/10" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default CardSkeletonGrid;