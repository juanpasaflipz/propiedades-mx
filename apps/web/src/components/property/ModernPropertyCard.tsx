'use client';

import { motion } from 'framer-motion';
import { Heart, MapPin, Bed, Bath, Square, Eye } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useFavoritesContext } from '@/contexts/FavoritesContext';

interface PropertyCardProps {
  id: string | number;
  title: string;
  price: number;
  location: string | { city: string; country: string; address?: string };
  bedrooms: number;
  bathrooms: number;
  area?: number;
  imageUrl?: string;
  propertyType: string;
  transactionType: 'rent' | 'sale';
  featured?: boolean;
}

export function ModernPropertyCard({
  id,
  title,
  price,
  location,
  bedrooms,
  bathrooms,
  area,
  imageUrl,
  propertyType,
  transactionType,
  featured = false,
}: PropertyCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  
  const propertyId = String(id);
  const isPropertyFavorite = isFavorite(propertyId);
  
  const locationString = typeof location === 'string' 
    ? location 
    : `${location.city}, ${location.country}`;

  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(price);
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({
      id: propertyId,
      title,
      price,
      location: locationString,
      imageUrl
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl',
        'bg-card shadow-lg hover:shadow-2xl transition-all duration-300',
        featured && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 z-10" />
        
        {/* Property Type Badge */}
        <div className="absolute top-4 left-4 z-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass px-3 py-1 rounded-full text-xs font-medium text-white"
          >
            {propertyType}
          </motion.div>
        </div>

        {/* Transaction Type Badge */}
        <div className="absolute top-4 right-4 z-20">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold',
              transactionType === 'sale'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
            )}
          >
            {transactionType === 'sale' ? 'EN VENTA' : 'EN RENTA'}
          </motion.div>
        </div>

        {/* Favorite Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleFavoriteClick}
          className="absolute bottom-4 right-4 z-20 p-3 rounded-full glass backdrop-blur-md"
        >
          <Heart
            className={cn(
              'w-5 h-5 transition-all',
              isPropertyFavorite ? 'fill-red-500 text-red-500' : 'text-white'
            )}
          />
        </motion.button>

        {/* Image */}
        <motion.img
          src={imageUrl || '/placeholder-property.jpg'}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onLoad={() => setImageLoaded(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoaded ? 1 : 0 }}
        />

        {/* Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 animate-pulse" />
        )}

        {/* View on Hover */}
        <Link href={`/properties/${id}`}>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileHover={{ opacity: 1, scale: 1 }}
              className="glass px-4 py-2 rounded-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">Ver Detalles</span>
            </motion.div>
          </div>
        </Link>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Price */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-baseline gap-2 mb-3"
        >
          <span className="text-3xl font-bold text-gradient">{formattedPrice}</span>
          {transactionType === 'rent' && (
            <span className="text-muted-foreground text-sm">/mes</span>
          )}
        </motion.div>

        {/* Title */}
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors"
        >
          <Link href={`/properties/${id}`}>{title}</Link>
        </motion.h3>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center gap-1 text-muted-foreground mb-4"
        >
          <MapPin className="w-4 h-4" />
          <span className="text-sm">
            {typeof location === 'string' 
              ? location 
              : `${location.city}, ${location.country}`}
          </span>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4 pt-4 border-t border-border"
        >
          <div className="flex items-center gap-1">
            <Bed className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{bedrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{bathrooms}</span>
          </div>
          {area && (
            <div className="flex items-center gap-1">
              <Square className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{area} m²</span>
            </div>
          )}
        </motion.div>

        {/* Featured Indicator */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: "spring" }}
            className="absolute -top-1 -right-1 w-20 h-20"
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-full animate-pulse-glow" />
              <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary">NUEVO</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.article>
  );
}