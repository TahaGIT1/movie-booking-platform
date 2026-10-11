import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, AUTHORITATIVE_CITIES } from '../services/api';

const LocationContext = createContext(null);

const STORAGE_CITY_ID_KEY = 'tt_selected_city_id';

export const LocationProvider = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState(AUTHORITATIVE_CITIES);
  const [popularCities, setPopularCities] = useState(() =>
    AUTHORITATIVE_CITIES.filter((c) => c.isPopular)
  );
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Clean up any legacy mock values stored from prior versions
  const sanitizeLegacyStorage = useCallback(() => {
    try {
      const legacy = localStorage.getItem('selectedLocation');
      if (legacy && (legacy.includes('Global') || legacy.includes('Malaysia'))) {
        localStorage.removeItem('selectedLocation');
      }
    } catch {}
  }, []);

  // Fetch authoritative cities catalogue from API (with robust local fallback)
  const fetchCities = useCallback(async () => {
    setIsLoadingCities(true);
    setError(null);
    try {
      const result = await api.getCities();
      const loadedCities = Array.isArray(result?.cities) && result.cities.length > 0
        ? result.cities
        : AUTHORITATIVE_CITIES;

      const loadedPopular = Array.isArray(result?.popular) && result.popular.length > 0
        ? result.popular
        : loadedCities.filter((c) => c.isPopular);

      setCities(loadedCities);
      setPopularCities(loadedPopular);

      // Hydrate & validate persisted selection
      sanitizeLegacyStorage();
      const savedId = localStorage.getItem(STORAGE_CITY_ID_KEY);

      if (savedId) {
        const cleanId = savedId.trim().toLowerCase();
        const matched = loadedCities.find(
          (c) => c.id.toLowerCase() === cleanId || c.name.toLowerCase() === cleanId
        );

        if (matched) {
          setSelectedCity(matched);
        } else {
          // Saved ID is obsolete, malformed, or no longer available
          console.warn(`[LocationContext] Stored city ID "${savedId}" is no longer valid. Resetting selection.`);
          localStorage.removeItem(STORAGE_CITY_ID_KEY);
          setSelectedCity(null);
        }
      } else {
        // First visit or unselected state
        setSelectedCity(null);
      }
    } catch (err) {
      console.warn('[LocationContext] Error fetching cities catalogue:', err);
      setError('Failed to fetch cities. Please check your connection.');
      // Keep authoritative fallback
      setCities(AUTHORITATIVE_CITIES);
      setPopularCities(AUTHORITATIVE_CITIES.filter((c) => c.isPopular));
    } finally {
      setIsLoadingCities(false);
      setIsInitialized(true);
    }
  }, [sanitizeLegacyStorage]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  // Select a city by object or ID
  const selectCity = useCallback((cityOrId) => {
    if (!cityOrId) return;

    let targetCity = null;
    if (typeof cityOrId === 'string') {
      const q = cityOrId.trim().toLowerCase();
      targetCity = cities.find(
        (c) => c.id.toLowerCase() === q || c.name.toLowerCase() === q
      );
    } else if (typeof cityOrId === 'object' && cityOrId.id) {
      targetCity = cities.find((c) => c.id === cityOrId.id) || cityOrId;
    }

    if (targetCity) {
      setSelectedCity(targetCity);
      try {
        localStorage.setItem(STORAGE_CITY_ID_KEY, targetCity.id);
      } catch (e) {
        console.warn('[LocationContext] Could not persist selected city to localStorage:', e);
      }
      setIsLocationModalOpen(false);
    } else {
      console.warn('[LocationContext] Attempted to select invalid city:', cityOrId);
    }
  }, [cities]);

  // Clear current city selection
  const clearCity = useCallback(() => {
    setSelectedCity(null);
    try {
      localStorage.removeItem(STORAGE_CITY_ID_KEY);
    } catch {}
  }, []);

  const openLocationModal = useCallback(() => {
    setIsLocationModalOpen(true);
  }, []);

  const closeLocationModal = useCallback(() => {
    setIsLocationModalOpen(false);
  }, []);

  const value = {
    selectedCity,
    selectedCityId: selectedCity ? selectedCity.id : null,
    cities,
    popularCities,
    isLoadingCities,
    isInitialized,
    error,
    isLocationModalOpen,
    selectCity,
    clearCity,
    openLocationModal,
    closeLocationModal,
    retryFetchCities: fetchCities,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};
