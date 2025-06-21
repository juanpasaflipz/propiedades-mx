'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Sparkles, X, Loader2 } from 'lucide-react';
import { useSemanticSearch } from '@/hooks/useSemanticSearch';
import { Property } from '@/types/property';
import { ModernPropertyCard } from '@/components/property/ModernPropertyCard';
import { motion, AnimatePresence } from 'framer-motion';

interface SemanticPropertySearchProps {
  onSearchComplete?: (results: Property[]) => void;
  showResults?: boolean;
  placeholder?: string;
  className?: string;
}

export function SemanticPropertySearch({
  onSearchComplete,
  showResults = true,
  placeholder = "Busca propiedades de forma natural: 'casa con jardín cerca de escuelas'",
  className = '',
}: SemanticPropertySearchProps) {
  const [query, setQuery] = useState('');
  const [showExplanations, setShowExplanations] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { search, loading, error, lastResults } = useSemanticSearch({
    useReranking: true,
    language: 'es',
    includeExplanation: showExplanations,
  });

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    const results = await search(query);
    
    if (results && onSearchComplete) {
      onSearchComplete(results.properties.map(p => p.property));
    }

    // Update URL with search query
    const params = new URLSearchParams(searchParams);
    params.set('q', query);
    params.set('semantic', 'true');
    router.push(`/properties?${params.toString()}`);
  }, [query, search, onSearchComplete, router, searchParams]);

  return (
    <div className={`space-y-6 ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full px-12 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
            {!loading && (
              <>
                <button
                  type="button"
                  onClick={() => setShowExplanations(!showExplanations)}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  title={showExplanations ? "Ocultar explicaciones" : "Mostrar explicaciones"}
                >
                  <Sparkles className={`w-5 h-5 ${showExplanations ? 'text-blue-500' : 'text-gray-400'}`} />
                </button>
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Sparkles className="w-4 h-4" />
            <span>Búsqueda inteligente con IA</span>
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Buscar
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {showResults && lastResults && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {lastResults.properties.length} propiedades encontradas
              </h3>
              {lastResults.searchContext.llmReranked && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Resultados optimizados con IA
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lastResults.properties.map(({ property, score, explanation }, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <ModernPropertyCard
                    id={property.id}
                    title={property.title}
                    price={property.price}
                    location={property.location}
                    bedrooms={property.bedrooms}
                    bathrooms={property.bathrooms}
                    area={property.area}
                    imageUrl={property.imageUrl || property.images?.[0]?.url}
                    propertyType={property.propertyType}
                    transactionType={property.transactionType}
                  />
                  
                  {showExplanations && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Relevancia:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${score * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-700 font-medium">
                            {Math.round(score * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      {explanation && (
                        <p className="text-sm text-gray-600 italic">
                          {explanation}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}