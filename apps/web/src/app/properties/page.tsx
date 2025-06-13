'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Filter, X, ChevronDown, Home } from 'lucide-react';
import { ModernPropertyCard } from '@/components/property/ModernPropertyCard';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { cn } from '@/lib/utils';

// Mock data for demonstration
const mockProperties = [
  {
    id: '1',
    title: 'Luxury Penthouse with Ocean View',
    price: 8500000,
    location: 'Playa del Carmen, Quintana Roo',
    bedrooms: 3,
    bathrooms: 3,
    area: 250,
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    propertyType: 'Penthouse',
    transactionType: 'sale' as const,
    featured: true,
  },
  {
    id: '2',
    title: 'Modern House in Polanco',
    price: 45000,
    location: 'Polanco, Ciudad de México',
    bedrooms: 4,
    bathrooms: 3,
    area: 320,
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    propertyType: 'House',
    transactionType: 'rent' as const,
  },
  {
    id: '3',
    title: 'Beachfront Condo',
    price: 5200000,
    location: 'Cancún, Quintana Roo',
    bedrooms: 2,
    bathrooms: 2,
    area: 120,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    propertyType: 'Condo',
    transactionType: 'sale' as const,
  },
  {
    id: '4',
    title: 'Colonial Style Home',
    price: 6800000,
    location: 'San Miguel de Allende, Guanajuato',
    bedrooms: 5,
    bathrooms: 4,
    area: 450,
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    propertyType: 'House',
    transactionType: 'sale' as const,
    featured: true,
  },
  {
    id: '5',
    title: 'Downtown Apartment',
    price: 22000,
    location: 'Roma Norte, Ciudad de México',
    bedrooms: 2,
    bathrooms: 1,
    area: 85,
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    propertyType: 'Apartment',
    transactionType: 'rent' as const,
  },
  {
    id: '6',
    title: 'Luxury Villa with Pool',
    price: 12500000,
    location: 'Nuevo Vallarta, Nayarit',
    bedrooms: 6,
    bathrooms: 5,
    area: 600,
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
    propertyType: 'Villa',
    transactionType: 'sale' as const,
  },
];

const sortOptions = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'area-asc', label: 'Size: Small to Large' },
  { value: 'area-desc', label: 'Size: Large to Small' },
  { value: 'newest', label: 'Newest First' },
];

const propertyTypes = ['All', 'House', 'Apartment', 'Condo', 'Villa', 'Penthouse'];
const transactionTypes = ['All', 'Sale', 'Rent'];

export default function PropertiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [propertyType, setPropertyType] = useState('All');
  const [transactionType, setTransactionType] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [properties, setProperties] = useState(mockProperties);
  const [loading, setLoading] = useState(false);

  // Filter properties based on criteria
  useEffect(() => {
    let filtered = [...mockProperties];

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(p => 
        p.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Property type filter
    if (propertyType !== 'All') {
      filtered = filtered.filter(p => p.propertyType === propertyType);
    }

    // Transaction type filter
    if (transactionType !== 'All') {
      filtered = filtered.filter(p => 
        p.transactionType === transactionType.toLowerCase()
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'area-asc':
          return (a.area || 0) - (b.area || 0);
        case 'area-desc':
          return (b.area || 0) - (a.area || 0);
        default:
          return 0;
      }
    });

    setProperties(filtered);
  }, [searchQuery, locationFilter, sortBy, propertyType, transactionType]);

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Browse Properties</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Find your perfect property from our extensive collection
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-4xl mx-auto"
          >
            <div className="glass rounded-2xl p-2 shadow-xl">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-background/50 backdrop-blur-sm rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Location..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-background/50 backdrop-blur-sm rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-6 py-4 bg-primary/10 text-primary rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/20 transition-colors"
                >
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters and Results */}
      <section className="px-4 pb-20">
        <div className="container">
          {/* Filter Bar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 overflow-hidden"
              >
                <div className="glass rounded-2xl p-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Property Type */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Property Type</label>
                      <div className="flex flex-wrap gap-2">
                        {propertyTypes.map((type) => (
                          <motion.button
                            key={type}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setPropertyType(type)}
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                              propertyType === type
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                            )}
                          >
                            {type}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Transaction Type */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Transaction Type</label>
                      <div className="flex gap-2">
                        {transactionTypes.map((type) => (
                          <motion.button
                            key={type}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setTransactionType(type)}
                            className={cn(
                              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                              transactionType === type
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                            )}
                          >
                            {type}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Sort By */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Sort By</label>
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="w-full px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium flex items-center justify-between transition-colors">
                            <span>{sortOptions.find(o => o.value === sortBy)?.label}</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="glass rounded-lg p-2 shadow-xl min-w-[200px]"
                            sideOffset={5}
                          >
                            {sortOptions.map((option) => (
                              <DropdownMenu.Item
                                key={option.value}
                                onSelect={() => setSortBy(option.value)}
                                className={cn(
                                  'px-3 py-2 rounded-md cursor-pointer transition-colors',
                                  'hover:bg-primary/10 hover:text-primary',
                                  sortBy === option.value && 'bg-primary/10 text-primary'
                                )}
                              >
                                {option.label}
                              </DropdownMenu.Item>
                            ))}
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground"
            >
              Found <span className="font-semibold text-foreground">{properties.length}</span> properties
            </motion.p>
          </div>

          {/* Property Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {properties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ModernPropertyCard {...property} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty State */}
          {properties.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Home className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No properties found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search criteria</p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}