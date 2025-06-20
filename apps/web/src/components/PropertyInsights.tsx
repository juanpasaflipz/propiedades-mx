import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Home, MapPin, DollarSign } from 'lucide-react';
import { useMCP } from '@/hooks/useMCP';
import { formatCurrency } from '@/lib/utils';

interface PropertyInsightsProps {
  propertyId: number;
}

export const PropertyInsights: React.FC<PropertyInsightsProps> = ({ propertyId }) => {
  const { getPropertyInsights, loading, error } = useMCP();
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      const data = await getPropertyInsights(propertyId);
      if (data) {
        setInsights(data);
      }
    };

    fetchInsights();
  }, [propertyId, getPropertyInsights]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading insights: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  const { similarProperties, neighborhoodStats } = insights;

  return (
    <div className="space-y-6">
      {/* Neighborhood Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Neighborhood Statistics
          </CardTitle>
          <CardDescription>
            Market insights for this area
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Average Price</p>
              <p className="text-xl font-semibold">
                {formatCurrency(neighborhoodStats.avg_price)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Price Range</p>
              <p className="text-xl font-semibold">
                {formatCurrency(neighborhoodStats.min_price)} - {formatCurrency(neighborhoodStats.max_price)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Avg Area</p>
              <p className="text-xl font-semibold">
                {Math.round(neighborhoodStats.avg_area)} m²
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Listings</p>
              <p className="text-xl font-semibold">
                {neighborhoodStats.total_properties}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Similar Properties */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Similar Properties
          </CardTitle>
          <CardDescription>
            Properties with similar characteristics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {similarProperties.map((property: any) => (
              <div
                key={property.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                onClick={() => window.location.href = `/properties/${property.id}`}
              >
                <div className="space-y-1">
                  <h4 className="font-medium line-clamp-1">{property.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {property.location}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold">{formatCurrency(property.price)}</p>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round((1 - property.similarity_score) * 100)}% match
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};