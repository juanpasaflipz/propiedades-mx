'use client';

import React, { createContext, useContext } from 'react';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoriteProperty {
  id: string;
  title: string;
  price: number;
  location: string;
  imageUrl?: string;
  savedAt: string;
}

interface FavoritesContextType {
  favorites: FavoriteProperty[];
  isLoading: boolean;
  addFavorite: (property: Omit<FavoriteProperty, 'savedAt'>) => void;
  removeFavorite: (propertyId: string) => void;
  toggleFavorite: (property: Omit<FavoriteProperty, 'savedAt'>) => void;
  isFavorite: (propertyId: string) => boolean;
  getFavoriteCount: () => number;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const favoritesHook = useFavorites();

  return (
    <FavoritesContext.Provider value={favoritesHook}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
}