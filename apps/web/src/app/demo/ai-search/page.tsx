'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { NaturalLanguageSearch } from '@/components/search/NaturalLanguageSearch';
import { FilterObject } from '@/types/ai-search';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AISearchDemo() {
  const [filters, setFilters] = useState<FilterObject | null>(null);
  const [searchExecuted, setSearchExecuted] = useState(false);

  const handleSearch = (newFilters: FilterObject) => {
    setFilters(newFilters);
    setSearchExecuted(true);
    
    // Here you would normally use these filters to search properties
    console.log('Search filters:', newFilters);
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

        {/* Results Preview */}
        {searchExecuted && filters && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 max-w-4xl mx-auto"
          >
            <div className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-semibold mb-6">Filtros Generados para Búsqueda</h2>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">JSON para API:</h3>
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(filters, null, 2)}
                  </pre>
                </div>
                
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm">
                    Estos filtros se pueden usar directamente con tu API de búsqueda de propiedades.
                    La IA ha interpretado tu consulta en lenguaje natural y la ha convertido en parámetros estructurados.
                  </p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  onClick={() => {
                    // In a real app, this would navigate to the properties page with the filters
                    alert('En una aplicación real, esto te llevaría a la página de propiedades con estos filtros aplicados');
                  }}
                >
                  Buscar Propiedades con estos Filtros
                </motion.button>
              </div>
            </div>
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