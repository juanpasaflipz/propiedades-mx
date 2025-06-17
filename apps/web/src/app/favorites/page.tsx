'use client';

import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { ModernPropertyCard } from '@/components/property/ModernPropertyCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Home, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function FavoritesPage() {
  const { favorites, clearFavorites, getFavoriteCount } = useFavoritesContext();
  const router = useRouter();
  const favoriteCount = getFavoriteCount();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Heart className="h-8 w-8 fill-red-500 text-red-500" />
                My Favorites
              </h1>
              <p className="text-muted-foreground">
                {favoriteCount === 0 
                  ? 'No properties saved yet' 
                  : `${favoriteCount} ${favoriteCount === 1 ? 'property' : 'properties'} saved`}
              </p>
            </div>
            
            {favoriteCount > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all favorites?')) {
                    clearFavorites();
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </motion.div>
        </div>

        {/* Content */}
        {favoriteCount === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="max-w-md mx-auto text-center">
              <CardHeader>
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <Heart className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardTitle>No favorites yet</CardTitle>
                <CardDescription>
                  Start browsing properties and click the heart icon to save your favorites
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push('/')}>
                  <Home className="h-4 w-4 mr-2" />
                  Browse Properties
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {favorites.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ModernPropertyCard
                  id={property.id}
                  title={property.title}
                  price={property.price}
                  location={property.location}
                  bedrooms={0} // These would need to be stored in favorites
                  bathrooms={0}
                  propertyType="Property"
                  transactionType="sale"
                  imageUrl={property.imageUrl}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Quick Stats */}
        {favoriteCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{favoriteCount}</div>
                    <div className="text-sm text-muted-foreground">Total Saved</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      ${Math.round(favorites.reduce((sum, p) => sum + p.price, 0) / favorites.length).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Average Price</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {new Date(favorites[favorites.length - 1]?.savedAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Last Added</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}