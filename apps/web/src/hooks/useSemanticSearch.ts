import { useState, useCallback } from 'react';
import { Property } from '@/types/property';
import { FilterObject } from '@/types/ai-search';

interface SemanticSearchResult {
  properties: Array<{
    property: Property;
    score: number;
    explanation?: string;
    distance?: number;
  }>;
  searchContext: {
    parsedQuery?: any;
    embeddingUsed: boolean;
    llmReranked?: boolean;
    language?: string;
  };
}

interface UseSemanticSearchOptions {
  useReranking?: boolean;
  language?: 'es' | 'en';
  includeExplanation?: boolean;
}

interface UseSemanticSearchResult {
  search: (query: string, filters?: FilterObject, limit?: number) => Promise<SemanticSearchResult | null>;
  loading: boolean;
  error: string | null;
  lastQuery: string | null;
  lastResults: SemanticSearchResult | null;
}

export function useSemanticSearch(options: UseSemanticSearchOptions = {}): UseSemanticSearchResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<SemanticSearchResult | null>(null);

  const {
    useReranking = true,
    language = 'es',
    includeExplanation = false
  } = options;

  const search = useCallback(async (
    query: string,
    filters?: FilterObject,
    limit: number = 20
  ): Promise<SemanticSearchResult | null> => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return null;
    }

    setLoading(true);
    setError(null);
    setLastQuery(query);

    try {
      const response = await fetch('/api/ai/semantic-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          filters,
          limit,
          includeExplanation,
          useLLMReranking: useReranking,
          language
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform semantic search');
      }

      const data = await response.json();
      setLastResults(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Semantic search error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [useReranking, language, includeExplanation]);

  return {
    search,
    loading,
    error,
    lastQuery,
    lastResults,
  };
}