import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, MapPin, Check, Building2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useLocationContext } from '../contexts/LocationContext';

export const CitySelectionModal = () => {
  const {
    selectedCity,
    cities,
    popularCities,
    isLoadingCities,
    error,
    isLocationModalOpen,
    selectCity,
    closeLocationModal,
    retryFetchCities,
  } = useLocationContext();

  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Auto-focus input and reset query when opened
  useEffect(() => {
    if (isLocationModalOpen) {
      setSearchQuery('');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLocationModalOpen]);

  // Handle keyboard events: Escape to close, etc.
  useEffect(() => {
    if (!isLocationModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('');
        } else {
          closeLocationModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocationModalOpen, searchQuery, closeLocationModal]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isLocationModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLocationModalOpen]);

  // Filtered search results
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return cities;
    const q = searchQuery.toLowerCase().trim();
    return cities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.id.includes(q)
    );
  }, [cities, searchQuery]);

  if (!isLocationModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeLocationModal();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="city-modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-[#11131c] border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-7 border-b border-white/10 relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="p-1.5 rounded-lg bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/20">
                  <MapPin className="w-4 h-4" />
                </span>
                <h2
                  id="city-modal-title"
                  className="text-xl sm:text-2xl font-heading font-black text-white tracking-tight"
                >
                  Choose your city
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400">
                Select your city to browse movies, cinemas, and showtimes available in your area
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={closeLocationModal}
              className="p-2 -mr-2 -mt-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative mt-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for your city (e.g. Kuala Lumpur, Mumbai...)"
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] text-sm text-white placeholder-neutral-500 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-xs text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={retryFetchCities}
                className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoadingCities && (
            <div className="space-y-4">
              <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-white/5 border border-white/5 animate-pulse"
                  />
                ))}
              </div>
            </div>
          )}

          {/* When Search is Empty: Display Popular Cities First */}
          {!isLoadingCities && !searchQuery.trim() && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#f5a623]" />
                  Popular Cities
                </span>
                {selectedCity && (
                  <span className="text-xs text-neutral-400">
                    Current:{' '}
                    <span className="text-[#f5a623] font-semibold">{selectedCity.name}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
                {popularCities.map((city) => {
                  const isSelected = selectedCity?.id === city.id;
                  return (
                    <button
                      key={city.id}
                      onClick={() => selectCity(city)}
                      className={`group p-3 sm:p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#f5a623]/15 border-[#f5a623] text-white shadow-lg shadow-[#f5a623]/10'
                          : 'bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/10 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 w-full mb-1">
                        <span className={`text-xs sm:text-sm font-semibold truncate ${isSelected ? 'text-[#f5a623]' : 'group-hover:text-white'}`}>
                          {city.name}
                        </span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-[#f5a623] shrink-0" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-400 shrink-0 opacity-60" />
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500 truncate">
                        {city.state ? `${city.state}, ` : ''}{city.country}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Cities / Filtered Results */}
          {!isLoadingCities && (
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  {searchQuery.trim()
                    ? `Matching Results (${filteredCities.length})`
                    : 'All Other Cities'}
                </span>
              </div>

              {filteredCities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredCities
                    // If no search, filter out the popular ones already displayed in the top section
                    .filter((c) => (searchQuery.trim() ? true : !c.isPopular))
                    .map((city) => {
                      const isSelected = selectedCity?.id === city.id;
                      return (
                        <button
                          key={city.id}
                          onClick={() => selectCity(city)}
                          className={`group w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-[#f5a623]/15 border-[#f5a623] text-white'
                              : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-neutral-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs sm:text-sm font-semibold truncate ${isSelected ? 'text-[#f5a623]' : 'group-hover:text-white'}`}>
                                {city.name}
                              </span>
                              {city.isPopular && searchQuery.trim() && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#f5a623]/20 text-[#f5a623]">
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                              {city.state ? `${city.state}, ` : ''}{city.country}
                            </p>
                          </div>

                          {isSelected ? (
                            <span className="p-1 rounded-full bg-[#f5a623] text-black">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-[11px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              Select →
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              ) : (
                /* Empty State */
                <div className="py-12 px-4 text-center">
                  <div className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 text-neutral-400 mb-3">
                    <MapPin className="w-6 h-6 text-[#f5a623]" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    No cities found matching "{searchQuery}"
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-4">
                    We couldn't find any location with that name. Try searching by state or choosing from the list.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      inputRef.current?.focus();
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-neutral-500">
          <span>Manual selection saved locally for your next visit.</span>
          <button
            onClick={closeLocationModal}
            className="px-4 py-1.5 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
