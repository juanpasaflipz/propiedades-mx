'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, Loader2, SlidersHorizontal, Sparkles } from 'lucide-react';
import { ModernPropertyCard } from '@/components/property/ModernPropertyCard';
import { NaturalLanguageSearch } from '@/components/search/NaturalLanguageSearch';
import { SemanticPropertySearch } from '@/components/SemanticPropertySearch';
import { AdvancedFilters } from '@/components/search/AdvancedFilters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PropertyProvider } from '@/lib/property-provider';
import { SearchFilters } from '@/types/api';

function PropertiesContent() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({
    country: 'Mexico'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'newest'>('newest');
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);

  const propertyProvider = new PropertyProvider();

  // Load properties
  useEffect(() => {
    loadProperties();
  }, [activeFilters, sortBy]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const results = await propertyProvider.searchProperties(activeFilters, 1, 50);
      
      // Ensure we have a valid response with listings array
      if (!results || !Array.isArray(results.listings)) {
        console.error('Invalid response from property provider:', results);
        setProperties([]);
        return;
      }
      
      // Sort properties
      let sorted = [...results.listings];
      switch (sortBy) {
        case 'price-asc':
          sorted.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          sorted.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          // Already sorted by newest from API
          break;
      }
      
      setProperties(sorted);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (filters: any) => {
    const searchFilters: SearchFilters = {
      country: 'Mexico',
      city: filters.city || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      propertyType: filters.propertyType || undefined,
      minBedrooms: filters.minBedrooms || undefined,
      minBathrooms: filters.minBathrooms || undefined,
      area: filters.neighborhood || undefined,
    };
    
    setActiveFilters(searchFilters);
    setShowFilters(false);
  };

  const handleAISearch = (filters: any) => {
    // Capitalize first letter of location for database compatibility
    const location = filters.location ? 
      filters.location.charAt(0).toUpperCase() + filters.location.slice(1).toLowerCase() : 
      undefined;
    
    const searchFilters: SearchFilters = {
      country: 'Mexico',
      city: location,
      minPrice: filters.priceRange?.min || undefined,
      maxPrice: filters.priceRange?.max || undefined,
      propertyType: filters.propertyType || undefined,
      minBedrooms: filters.bedrooms || undefined,
      minBathrooms: filters.bathrooms || undefined,
    };
    
    setActiveFilters(searchFilters);
  };

  const clearFilters = () => {
    setActiveFilters({ country: 'Mexico' });
    setSearchQuery('');
  };

  const activeFilterCount = Object.keys(activeFilters).filter(
    key => key !== 'country' && activeFilters[key as keyof SearchFilters]
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Advanced Filters Sidebar */}
      <AdvancedFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onFiltersChange={handleFiltersChange}
      />

      {/* Main Content */}
      <div className={cn(
        "transition-all duration-300",
        showFilters ? "md:ml-96" : ""
      )}>
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-4">
              {/* Title and Actions */}
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Properties in Mexico</h1>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="hidden md:flex"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                  
                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 border rounded-lg bg-background"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto w-full space-y-4">
                {/* Search Type Toggle */}
                <div className="flex justify-center gap-2">
                  <Button
                    variant={!useSemanticSearch ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseSemanticSearch(false)}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Búsqueda Normal
                  </Button>
                  <Button
                    variant={useSemanticSearch ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseSemanticSearch(true)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Búsqueda Semántica IA
                  </Button>
                </div>
                
                {/* Search Component */}
                {useSemanticSearch ? (
                  <SemanticPropertySearch
                    onSearchComplete={setProperties}
                    showResults={false}
                  />
                ) : (
                  <NaturalLanguageSearch
                    onSearch={handleAISearch}
                  />
                )}
              </div>

              {/* Active Filters */}
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {activeFilters.city && (
                    <Badge variant="secondary">
                      City: {activeFilters.city}
                      <button
                        className="ml-2"
                        onClick={() => setActiveFilters({ ...activeFilters, city: undefined })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {activeFilters.propertyType && (
                    <Badge variant="secondary">
                      Type: {activeFilters.propertyType}
                      <button
                        className="ml-2"
                        onClick={() => setActiveFilters({ ...activeFilters, propertyType: undefined })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {(activeFilters.minPrice || activeFilters.maxPrice) && (
                    <Badge variant="secondary">
                      Price: ${activeFilters.minPrice?.toLocaleString() || '0'} - ${activeFilters.maxPrice?.toLocaleString() || '∞'}
                      <button
                        className="ml-2"
                        onClick={() => setActiveFilters({ ...activeFilters, minPrice: undefined, maxPrice: undefined })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filter Button */}
        <div className="md:hidden fixed bottom-4 right-4 z-50">
          <Button
            size="lg"
            onClick={() => setShowFilters(true)}
            className="rounded-full shadow-lg"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Properties Grid */}
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">No properties found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or search criteria
              </p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-muted-foreground">
                  Found {properties.length} properties
                </p>
              </div>
              
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {properties.map((property, index) => (
                    <motion.div
                      key={property.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ModernPropertyCard
                        id={property.id}
                        title={property.title}
                        price={property.price}
                        location={property.location}
                        bedrooms={property.bedrooms}
                        bathrooms={property.bathrooms}
                        area={property.area}
                        imageUrl={property.imageUrl}
                        propertyType={property.propertyType}
                        transactionType={property.transactionType}
                        featured={property.featured}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  );
}