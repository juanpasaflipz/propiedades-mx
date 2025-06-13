'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Home, TrendingUp, Sparkles, ChevronDown, Building, Bed, Bath, Square, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ModernPropertyCard } from '@/components/property/ModernPropertyCard';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('q', searchQuery);
    if (location) params.append('location', location);
    router.push(`/properties?${params.toString()}`);
  };

  const popularCities = [
    { name: 'Ciudad de México', count: '12,543', image: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400' },
    { name: 'Guadalajara', count: '8,234', image: 'https://images.unsplash.com/photo-1568694734442-77384fc8a5ff?w=400' },
    { name: 'Monterrey', count: '6,789', image: 'https://images.unsplash.com/photo-1590254625449-b1677eebc2be?w=400' },
    { name: 'Playa del Carmen', count: '5,432', image: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=400' },
  ];

  const features = [
    { icon: Search, title: 'Smart Search', description: 'AI-powered search to find your perfect home' },
    { icon: MapPin, title: 'Prime Locations', description: 'Properties in the best neighborhoods across Mexico' },
    { icon: TrendingUp, title: 'Market Insights', description: 'Real-time pricing and market trends analysis' },
    { icon: Sparkles, title: 'Verified Listings', description: 'All properties verified for accuracy and availability' },
  ];

  const latestProperties = [
    {
      id: '7',
      title: 'Studio Loft in Condesa',
      price: 18000,
      location: 'Condesa, CDMX',
      bedrooms: 1,
      bathrooms: 1,
      area: 55,
      imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      propertyType: 'Studio',
      transactionType: 'rent' as const,
    },
    {
      id: '8',
      title: 'Garden House in Coyoacán',
      price: 7200000,
      location: 'Coyoacán, CDMX',
      bedrooms: 3,
      bathrooms: 2,
      area: 280,
      imageUrl: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
      propertyType: 'House',
      transactionType: 'sale' as const,
    },
    {
      id: '9',
      title: 'Beach House in Tulum',
      price: 9500000,
      location: 'Tulum, Quintana Roo',
      bedrooms: 4,
      bathrooms: 4,
      area: 380,
      imageUrl: 'https://images.unsplash.com/photo-1615571022219-eb45cf7faa9d?w=800',
      propertyType: 'House',
      transactionType: 'sale' as const,
    },
  ];

  const featuredProperties = [
    {
      id: '1',
      title: 'Luxury Penthouse with Ocean View',
      price: 8500000,
      location: 'Playa del Carmen',
      bedrooms: 3,
      bathrooms: 3,
      area: 250,
      imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      propertyType: 'Penthouse',
      transactionType: 'sale' as const,
    },
    {
      id: '2',
      title: 'Modern House in Polanco',
      price: 45000,
      location: 'Ciudad de México',
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
      location: 'Cancún',
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
      location: 'San Miguel de Allende',
      bedrooms: 5,
      bathrooms: 4,
      area: 450,
      imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      propertyType: 'House',
      transactionType: 'sale' as const,
    },
    {
      id: '5',
      title: 'Downtown Apartment',
      price: 22000,
      location: 'Roma Norte, CDMX',
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
      location: 'Nuevo Vallarta',
      bedrooms: 6,
      bathrooms: 5,
      area: 600,
      imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
      propertyType: 'Villa',
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
              <span className="text-sm font-medium">Discover your dream home in Mexico</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-gradient">Find Your Perfect</span>
              <br />
              <span className="relative">
                Home in Mexico
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              Browse thousands of properties across Mexico with our advanced search and real-time updates.
              Your dream home is just a click away.
            </p>

            {/* Search Form */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative max-w-3xl mx-auto"
            >
              <div className="glass rounded-2xl p-2 shadow-2xl">
                <div className="flex flex-col md:flex-row gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by property type, features..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-background/50 backdrop-blur-sm rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Location or city..."
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
                    Search Properties
                  </motion.button>
                </div>
              </div>
            </motion.form>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-8 mt-12"
            >
              {[
                { label: 'Active Listings', value: '50,000+' },
                { label: 'Cities Covered', value: '120+' },
                { label: 'Happy Customers', value: '10,000+' },
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
              <span className="text-sm">Explore More</span>
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
            <h2 className="text-4xl font-bold mb-4">Popular Cities</h2>
            <p className="text-muted-foreground">Discover properties in Mexico's most sought-after locations</p>
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
                      <p className="text-white/80">{city.count} properties</p>
                    </div>
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
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
              <h2 className="text-4xl font-bold mb-2">Featured Properties</h2>
              <p className="text-muted-foreground">Hand-picked properties just for you</p>
            </div>
            <Link href="/properties">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                View All Properties
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
                View All Properties
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
            <h2 className="text-4xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-muted-foreground">Experience the future of real estate searching</p>
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
            <h2 className="text-4xl font-bold mb-4">Latest Listings</h2>
            <p className="text-muted-foreground">Fresh properties added daily</p>
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
              <h2 className="text-4xl font-bold text-white mb-4">Ready to Find Your Dream Home?</h2>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of happy homeowners who found their perfect property through our platform
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/properties')}
                className="px-8 py-4 bg-white text-primary rounded-xl font-semibold shadow-2xl hover:shadow-3xl transition-all"
              >
                Start Searching Now
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}