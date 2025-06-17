'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Home, TrendingUp, Sparkles, ChevronDown, Building, Bed, Bath, Square, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ModernPropertyCard } from '@/components/property/ModernPropertyCard';
import { NaturalLanguageSearch } from '@/components/search/NaturalLanguageSearch';
import { QuickFilters } from '@/components/search/QuickFilters';
import { FilterObject } from '@/types/ai-search';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [searchMode, setSearchMode] = useState<'traditional' | 'ai'>('ai');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (location) params.append('location', location);
    router.push(`/properties?${params.toString()}`);
  };

  const handleAISearch = (filters: FilterObject) => {
    const params = new URLSearchParams();
    if (filters.location) params.append('location', filters.location);
    if (filters.propertyType) params.append('propertyType', filters.propertyType);
    if (filters.transactionType) params.append('transactionType', filters.transactionType);
    if (filters.bedrooms) params.append('minBedrooms', filters.bedrooms.toString());
    if (filters.bathrooms) params.append('minBathrooms', filters.bathrooms.toString());
    if (filters.priceRange?.min) params.append('minPrice', filters.priceRange.min.toString());
    if (filters.priceRange?.max) params.append('maxPrice', filters.priceRange.max.toString());
    
    router.push(`/properties?${params.toString()}&aiSearch=true`);
  };

  const popularCities = [
    { name: 'Ciudad de México', count: '12,543', image: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400' },
    { name: 'Guadalajara', count: '8,234', image: 'https://images.unsplash.com/photo-1568694734442-77384fc8a5ff?w=400' },
    { name: 'Monterrey', count: '6,789', image: 'https://images.unsplash.com/photo-1590254625449-b1677eebc2be?w=400' },
    { name: 'Playa del Carmen', count: '5,432', image: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=400' },
  ];

  const features = [
    { icon: Search, title: 'Búsqueda Inteligente', description: 'Búsqueda con IA para encontrar tu hogar perfecto' },
    { icon: MapPin, title: 'Mejores Ubicaciones', description: 'Propiedades en los mejores barrios de México' },
    { icon: TrendingUp, title: 'Análisis del Mercado', description: 'Precios y tendencias del mercado en tiempo real' },
    { icon: Sparkles, title: 'Propiedades Verificadas', description: 'Todas las propiedades verificadas y disponibles' },
  ];

  const latestProperties = [
    {
      id: '357',
      title: 'Departamento En Venta Calle Confraco',
      price: 1850000,
      location: 'Tabla Honda, Tlalnepantla',
      bedrooms: 2,
      bathrooms: 1,
      area: 65,
      imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      propertyType: 'Departamento',
      transactionType: 'sale' as const,
    },
    {
      id: '356',
      title: 'Precioso Departamento de 3 Recámaras',
      price: 2100000,
      location: 'Ciudad de México',
      bedrooms: 3,
      bathrooms: 2,
      area: 85,
      imageUrl: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      propertyType: 'Departamento',
      transactionType: 'sale' as const,
    },
    {
      id: '355',
      title: 'Departamento En Venta En El Tenayo',
      price: 1450000,
      location: 'El Tenayo, Tlalnepantla',
      bedrooms: 2,
      bathrooms: 1,
      area: 60,
      imageUrl: 'https://images.unsplash.com/photo-1615571022219-eb45cf7faa9d?w=800',
      propertyType: 'Departamento',
      transactionType: 'sale' as const,
    },
  ];

  const featuredProperties = [
    {
      id: '389',
      title: 'Revolución 1877 - Loreto',
      price: 2125000,
      location: 'Álvaro Obregón, CDMX',
      bedrooms: 2,
      bathrooms: 2,
      area: 100,
      imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      propertyType: 'Casa',
      transactionType: 'sale' as const,
    },
    {
      id: '388',
      title: 'Gran Ciudad City Rent - Granada',
      price: 16500,
      location: 'Miguel Hidalgo, CDMX',
      bedrooms: 2,
      bathrooms: 2,
      area: 136,
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      propertyType: 'Casa',
      transactionType: 'rent' as const,
    },
    {
      id: '387',
      title: 'Local Comercial en Anahuac',
      price: 70000,
      location: 'Miguel Hidalgo, CDMX',
      bedrooms: 0,
      bathrooms: 0,
      area: 320,
      imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      propertyType: 'Local',
      transactionType: 'rent' as const,
    },
    {
      id: '386',
      title: 'Gran Ciudad Nuevo Polanco',
      price: 4500000,
      location: 'Miguel Hidalgo, CDMX',
      bedrooms: 3,
      bathrooms: 2,
      area: 180,
      imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      propertyType: 'Casa',
      transactionType: 'sale' as const,
    },
    {
      id: '385',
      title: 'Spaces Torre Summa - Santa Fe',
      price: 22000,
      location: 'Santa Fe, CDMX',
      bedrooms: 0,
      bathrooms: 1,
      area: 85,
      imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      propertyType: 'Oficina',
      transactionType: 'rent' as const,
    },
    {
      id: '354',
      title: 'Último Departamento En Toluca',
      price: 1800000,
      location: 'Toluca, Estado de México',
      bedrooms: 2,
      bathrooms: 2,
      area: 75,
      imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      propertyType: 'Departamento',
      transactionType: 'sale' as const,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 animate-gradient" />
        <div className="absolute inset-0 bg-gradient-radial" />
        
        {/* Floating shapes */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="container relative z-10 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Descubre tu hogar ideal en México</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-gradient">Encuentra tu Hogar</span>
              <br />
              <span className="relative">
                Perfecto en México
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Explora miles de propiedades en todo México con nuestra búsqueda avanzada y actualizaciones en tiempo real.
              Tu hogar ideal está a solo un clic de distancia.
            </p>

            {/* Search Mode Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center gap-2 mb-6"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSearchMode('ai')}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  searchMode === 'ai' 
                    ? "bg-white/20 backdrop-blur-sm text-white" 
                    : "bg-white/10 backdrop-blur-sm text-white/70 hover:text-white"
                )}
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                Búsqueda Inteligente
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSearchMode('traditional')}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  searchMode === 'traditional' 
                    ? "bg-white/20 backdrop-blur-sm text-white" 
                    : "bg-white/10 backdrop-blur-sm text-white/70 hover:text-white"
                )}
              >
                <Search className="w-4 h-4 inline mr-2" />
                Búsqueda Clásica
              </motion.button>
            </motion.div>

            {/* Search Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative max-w-3xl mx-auto"
            >
              {searchMode === 'ai' ? (
                <NaturalLanguageSearch onSearch={handleAISearch} className="w-full" />
              ) : (
                <form onSubmit={handleSearch}>
                  <div className="glass rounded-2xl p-2 shadow-2xl">
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Buscar por tipo de propiedad..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-background/50 backdrop-blur-sm rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                      <div className="flex-1 relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Ubicación o ciudad..."
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-background/50 backdrop-blur-sm rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        Buscar
                      </motion.button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-8 mt-12"
            >
              {[
                { label: 'Propiedades Activas', value: '50,000+' },
                { label: 'Ciudades', value: '120+' },
                { label: 'Clientes Satisfechos', value: '10,000+' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gradient">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-2 text-muted-foreground"
            >
              <span className="text-sm">Explorar Más</span>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Popular Cities */}
      <section className="py-20 px-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Ciudades Populares</h2>
            <p className="text-muted-foreground">Descubre propiedades en las ubicaciones más buscadas de México</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularCities.map((city, index) => (
              <motion.div
                key={city.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/properties?location=${city.name}`}>
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="group relative overflow-hidden rounded-2xl aspect-[4/5] cursor-pointer"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url(${city.image})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-2xl font-bold text-white mb-1">{city.name}</h3>
                      <p className="text-white/80">{city.count} propiedades</p>
                    </div>
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Filters Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Búsqueda Rápida</h2>
            <p className="text-muted-foreground">Encuentra exactamente lo que buscas con nuestros filtros avanzados</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <QuickFilters />
          </motion.div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-12"
          >
            <div>
              <h2 className="text-4xl font-bold mb-2">Propiedades Destacadas</h2>
              <p className="text-muted-foreground">Propiedades seleccionadas especialmente para ti</p>
            </div>
            <Link href="/properties">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Ver Todas las Propiedades
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Property Grid - 3 columns on desktop, 2 on tablet, 1 on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <ModernPropertyCard {...property} featured={index === 0} />
              </motion.div>
            ))}
          </div>

          {/* Mobile View All Button */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-8 text-center md:hidden"
          >
            <Link href="/properties">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg"
              >
                Ver Todas las Propiedades
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">¿Por Qué Elegirnos?</h2>
            <p className="text-muted-foreground">Experimenta el futuro de la búsqueda inmobiliaria</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300"
                >
                  <feature.icon className="w-8 h-8 text-primary" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Listings */}
      <section className="py-20 px-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">Últimas Propiedades</h2>
            <p className="text-muted-foreground">Nuevas propiedades agregadas diariamente</p>
          </motion.div>

          {/* Property Grid - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestProperties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <ModernPropertyCard {...property} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/90 to-accent/90 p-12 text-center"
          >
            <div className="absolute inset-0 bg-gradient-conic opacity-30" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-white mb-4">¿Listo para Encontrar tu Hogar Ideal?</h2>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                Únete a miles de propietarios felices que encontraron su propiedad perfecta a través de nuestra plataforma
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/properties')}
                className="px-8 py-4 bg-white text-primary rounded-xl font-semibold shadow-2xl hover:shadow-3xl transition-all"
              >
                Comenzar a Buscar Ahora
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}