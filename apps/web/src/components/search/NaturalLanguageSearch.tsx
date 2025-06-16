'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Loader2, AlertCircle, Check } from 'lucide-react';
import { useNaturalLanguageSearch } from '@/hooks/useNaturalLanguageSearch';
import { FilterObject } from '@/types/ai-search';
import { cn } from '@/lib/utils';

interface NaturalLanguageSearchProps {
  onSearch: (filters: FilterObject) => void;
  className?: string;
}

export function NaturalLanguageSearch({ onSearch, className }: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState('');
  const { parseQuery, loading, error, lastFilters } = useNaturalLanguageSearch();
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const filters = await parseQuery(query);
    if (filters) {
      setShowFilters(true);
      onSearch(filters);
    }
  };

  const exampleQueries = [
    "Casa en Polanco con 3 recámaras y jardín",
    "Departamento pet-friendly en la Condesa hasta 25 mil al mes",
    "Terreno en Querétaro para construir",
    "Oficina con estacionamiento en Santa Fe"
  ];

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl" />
          <div className="relative glass rounded-2xl p-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe la propiedad que buscas..."
                  className="w-full pl-12 pr-4 py-4 bg-background/50 backdrop-blur-sm rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  disabled={loading}
                />
              </div>
              <motion.button
                type="submit"
                disabled={loading || !query.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Buscar</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </form>

      {/* Example queries */}
      <div className="mt-4">
        <p className="text-sm text-muted-foreground mb-2">Prueba con:</p>
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setQuery(example)}
              className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              {example}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2"
          >
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parsed filters display */}
      <AnimatePresence>
        {showFilters && lastFilters && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 p-6 rounded-2xl bg-muted/50 backdrop-blur-sm"
          >
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Filtros detectados:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {lastFilters.location && (
                <FilterChip label="Ubicación" value={lastFilters.location} />
              )}
              {lastFilters.propertyType && (
                <FilterChip label="Tipo" value={getPropertyTypeLabel(lastFilters.propertyType)} />
              )}
              {lastFilters.bedrooms && (
                <FilterChip label="Recámaras" value={`${lastFilters.bedrooms}`} />
              )}
              {lastFilters.bathrooms && (
                <FilterChip label="Baños" value={`${lastFilters.bathrooms}`} />
              )}
              {lastFilters.transactionType && (
                <FilterChip label="Operación" value={lastFilters.transactionType === 'rent' ? 'Renta' : 'Venta'} />
              )}
              {lastFilters.priceRange && (
                <FilterChip 
                  label="Precio" 
                  value={formatPriceRange(lastFilters.priceRange)} 
                />
              )}
              {lastFilters.features && lastFilters.features.length > 0 && (
                <div className="col-span-2 md:col-span-3">
                  <p className="text-xs text-muted-foreground mb-1">Características:</p>
                  <div className="flex flex-wrap gap-2">
                    {lastFilters.features.map((feature, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary"
                      >
                        {getFeatureLabel(feature)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}:</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function getPropertyTypeLabel(type: string): string {
  const labels: { [key: string]: string } = {
    house: 'Casa',
    apartment: 'Departamento',
    condo: 'Condominio',
    land: 'Terreno',
    office: 'Oficina',
    commercial: 'Local Comercial'
  };
  return labels[type] || type;
}

function getFeatureLabel(feature: string): string {
  const labels: { [key: string]: string } = {
    'garden': 'Jardín',
    'pool': 'Alberca',
    'parking': 'Estacionamiento',
    'pet-friendly': 'Mascotas',
    'natural light': 'Luz Natural',
    'balcony': 'Balcón',
    'terrace': 'Terraza',
    'gym': 'Gimnasio',
    'security': 'Seguridad',
    'furnished': 'Amueblado',
    'view': 'Vista',
    'roof garden': 'Roof Garden',
    'home office': 'Home Office'
  };
  return labels[feature] || feature;
}

function formatPriceRange(range: { min: number; max: number }): string {
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  if (range.min === 0) {
    return `Hasta ${formatter.format(range.max)}`;
  }
  if (range.max === Number.MAX_SAFE_INTEGER) {
    return `Desde ${formatter.format(range.min)}`;
  }
  return `${formatter.format(range.min)} - ${formatter.format(range.max)}`;
}