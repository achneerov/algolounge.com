import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { favoritesApi } from '../api';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (filename: string) => boolean;
  addFavorite: (filename: string) => Promise<void>;
  removeFavorite: (filename: string) => Promise<void>;
  toggleFavorite: (filename: string) => Promise<void>;
  loadFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  const loadFavorites = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const response = await favoritesApi.getFavorites();
        setFavorites(response.favorites);
      } catch (error) {
        console.error('Failed to load favorites:', error);
        setFavorites([]);
      }
    } else {
      setFavorites([]);
    }
  }, [isAuthenticated]);

  const isFavorite = useCallback((filename: string) => {
    return favorites.includes(filename);
  }, [favorites]);

  const addFavorite = useCallback(async (filename: string) => {
    if (favorites.includes(filename)) return;

    const newFavorites = [...favorites, filename];
    setFavorites(newFavorites);

    try {
      await favoritesApi.addFavorite(filename);
    } catch (error) {
      console.error('Failed to add favorite:', error);
      // Revert on error
      setFavorites(favorites);
    }
  }, [favorites]);

  const removeFavorite = useCallback(async (filename: string) => {
    if (!favorites.includes(filename)) return;

    const newFavorites = favorites.filter(f => f !== filename);
    setFavorites(newFavorites);

    try {
      await favoritesApi.removeFavorite(filename);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      // Revert on error
      setFavorites(favorites);
    }
  }, [favorites]);

  const toggleFavorite = useCallback(async (filename: string) => {
    if (isFavorite(filename)) {
      await removeFavorite(filename);
    } else {
      await addFavorite(filename);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  // Load favorites on mount and when auth changes
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite, loadFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
