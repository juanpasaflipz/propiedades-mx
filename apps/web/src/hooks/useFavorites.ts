'use client';

import { useState, useEffect, useCallback } from 'react';

interface FavoriteProperty {
  id: string;
  title: string;
  price: number;
  location: string;
  imageUrl?: string;
  savedAt: string;
}

const FAVORITES_KEY = 'property_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error('Error saving favorites:', error);
      }
    }
  }, [favorites, isLoading]);

  const addFavorite = useCallback((property: Omit<FavoriteProperty, 'savedAt'>) => {
    setFavorites(prev => {
      // Check if already exists
      if (prev.some(fav => fav.id === property.id)) {
        return prev;
      }
      return [...prev, { ...property, savedAt: new Date().toISOString() }];
    });
  }, []);

  const removeFavorite = useCallback((propertyId: string) => {
    setFavorites(prev => prev.filter(fav => fav.id !== propertyId));
  }, []);

  const toggleFavorite = useCallback((property: Omit<FavoriteProperty, 'savedAt'>) => {
    setFavorites(prev => {
      const exists = prev.some(fav => fav.id === property.id);
      if (exists) {
        return prev.filter(fav => fav.id !== property.id);
      }
      return [...prev, { ...property, savedAt: new Date().toISOString() }];
    });
  }, []);

  const isFavorite = useCallback((propertyId: string) => {
    return favorites.some(fav => fav.id === propertyId);
  }, [favorites]);

  const getFavoriteCount = useCallback(() => {
    return favorites.length;
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoriteCount,
    clearFavorites
  };
}