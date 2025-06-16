'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NaturalLanguageSearch } from '@/components/search/NaturalLanguageSearch';
import { ModernPropertyCard } from '@/components/property/ModernPropertyCard';
import { FilterObject } from '@/types/ai-search';
import { PropertyProvider } from '@/lib/property-provider';
import { SearchFilters } from '@/types/api';
import { ArrowLeft, Loader2, Home } from 'lucide-react';
import Link from 'next/link';

export default function AISearchDemo() {
  const [filters, setFilters] = useState<FilterObject | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const propertyProvider = new PropertyProvider();

  const handleSearch = (newFilters: FilterObject) => {
    setFilters(newFilters);
    searchProperties(newFilters);
  };

  const searchProperties = async (aiFilters: FilterObject) => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert AI filters to property search filters
      const searchFilters: SearchFilters = {
        country: 'Mexico',
        city: aiFilters.location || undefined,
        transactionType: aiFilters.transactionType || undefined,
        minPrice: aiFilters.priceRange?.min,
        maxPrice: aiFilters.priceRange?.max,
        propertyType: aiFilters.propertyType || undefined,
        minBedrooms: aiFilters.bedrooms || undefined,
        minBathrooms: aiFilters.bathrooms || undefined,
      };
      
      const response = await propertyProvider.searchProperties(searchFilters, 1, 50);
      setProperties(response.listings);
    } catch (err) {
      console.error('Error searching properties:', err);
      setError('Error al buscar propiedades');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al inicio</span>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Búsqueda Inteligente con IA</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Describe la propiedad que buscas en lenguaje natural y nuestra IA interpretará tu búsqueda
            </p>
          </motion.div>
        </div>

        {/* Search Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <NaturalLanguageSearch onSearch={handleSearch} />
        </motion.div>

        {/* Property Results */}
        {filters && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">
                {loading ? 'Buscando propiedades...' : `${properties.length} propiedades encontradas`}
              </h2>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-20">
                <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Buscando propiedades que coincidan con tu búsqueda...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-20">
                <p className="text-destructive">{error}</p>
              </div>
            )}

            {/* Property Grid */}
            {!loading && !error && properties.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ModernPropertyCard {...property} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && !error && properties.length === 0 && (
              <div className="text-center py-20">
                <Home className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No se encontraron propiedades</h3>
                <p className="text-muted-foreground">
                  Intenta con una búsqueda diferente o ajusta los criterios
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <h2 className="text-2xl font-semibold text-center mb-8">Características de la Búsqueda con IA</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              title="Lenguaje Natural"
              description="Escribe como hablarías normalmente, en español o inglés"
              icon="💬"
            />
            <FeatureCard
              title="Comprensión Contextual"
              description="Entiende términos mexicanos como 'depa', 'recámara', 'alberca'"
              icon="🧠"
            />
            <FeatureCard
              title="Filtros Precisos"
              description="Convierte tu descripción en filtros estructurados para la base de datos"
              icon="🎯"
            />
            <FeatureCard
              title="Detección de Precios"
              description="Interpreta rangos como '30 mil al mes' o '2 millones'"
              icon="💰"
            />
            <FeatureCard
              title="Características"
              description="Identifica amenidades como jardín, mascotas, luz natural"
              icon="✨"
            />
            <FeatureCard
              title="Ubicaciones"
              description="Reconoce colonias, ciudades y zonas de México"
              icon="📍"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}