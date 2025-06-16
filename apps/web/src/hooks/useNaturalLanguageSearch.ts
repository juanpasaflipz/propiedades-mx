import { useState, useCallback } from 'react';
import { FilterObject } from '@/types/ai-search';

interface UseNaturalLanguageSearchResult {
  parseQuery: (query: string) => Promise<FilterObject | null>;
  loading: boolean;
  error: string | null;
  lastQuery: string | null;
  lastFilters: FilterObject | null;
}

export function useNaturalLanguageSearch(): UseNaturalLanguageSearchResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [lastFilters, setLastFilters] = useState<FilterObject | null>(null);

  const parseQuery = useCallback(async (query: string): Promise<FilterObject | null> => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return null;
    }

    setLoading(true);
    setError(null);
    setLastQuery(query);

    try {
      const response = await fetch('/api/ai/parse-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse query');
      }

      const data = await response.json();
      const filters = data.filters;
      
      setLastFilters(filters);
      return filters;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Natural language search error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    parseQuery,
    loading,
    error,
    lastQuery,
    lastFilters,
  };
}