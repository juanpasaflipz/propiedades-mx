'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Bed, 
  Bath, 
  Square, 
  MapPin, 
  DollarSign,
  Home,
  Calendar,
  ExternalLink,
  Share2,
  Heart,
  Phone,
  Mail,
  Building,
  Info
} from 'lucide-react';
import { useFavoritesContext } from '@/contexts/FavoritesContext';

interface PropertyDetails {
  id: string;
  source: string;
  country: string;
  state_province: string;
  city: string;
  address: string;
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  property_type: string;
  transaction_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number;
  contact_info: string;
  listing_date: string;
  last_updated: string;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const { isFavorite, toggleFavorite } = useFavoritesContext();

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
        const response = await fetch(`${apiUrl}/api/properties/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Property not found');
        }
        
        const data = await response.json();
        
        if (data) {
          setProperty(data);
        }
      } catch (error) {
        console.error('Error fetching property details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPropertyDetails();
    }
  }, [params.id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.description || 'Property Listing',
        text: `Check out this property in ${property?.city}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const formatPrice = (price: { amount: number; currency: string }) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: price.currency || 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price.amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Property not found</h1>
        <Button onClick={() => router.push('/')}>
          Back to Search
        </Button>
      </div>
    );
  }

  const propertyTitle = property.description || 
    `${property.property_type} in ${property.city}` || 
    'Property Listing';

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="relative h-[400px] bg-muted">
                <Image
                  src={imageError ? '/placeholder-property.svg' : '/placeholder-property.svg'}
                  alt={propertyTitle}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => property && toggleFavorite({
                      id: property.id,
                      title: propertyTitle,
                      price: property.price.amount,
                      location: `${property.city}, ${property.state_province}`,
                      imageUrl: '/placeholder-property.svg'
                    })}
                  >
                    <Heart className={`h-4 w-4 ${property && isFavorite(property.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Property Details Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{propertyTitle}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {property.address || `${property.city}, ${property.state_province}`}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {property.bedrooms > 0 && (
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <Bed className="h-6 w-6 mx-auto mb-2" />
                          <div className="text-2xl font-bold">{property.bedrooms}</div>
                          <div className="text-sm text-muted-foreground">Bedrooms</div>
                        </div>
                      )}
                      {property.bathrooms > 0 && (
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <Bath className="h-6 w-6 mx-auto mb-2" />
                          <div className="text-2xl font-bold">{property.bathrooms}</div>
                          <div className="text-sm text-muted-foreground">Bathrooms</div>
                        </div>
                      )}
                      {property.area_sqm > 0 && (
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <Square className="h-6 w-6 mx-auto mb-2" />
                          <div className="text-2xl font-bold">{property.area_sqm}</div>
                          <div className="text-sm text-muted-foreground">m²</div>
                        </div>
                      )}
                    </div>
                    
                    {property.description && (
                      <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {property.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Property Type</dt>
                        <dd className="text-sm capitalize">{property.property_type}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Transaction Type</dt>
                        <dd className="text-sm capitalize">{property.transaction_type}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Listed</dt>
                        <dd className="text-sm">{formatDate(property.listing_date)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
                        <dd className="text-sm">{formatDate(property.last_updated)}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Source</dt>
                        <dd className="text-sm capitalize">{property.source}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Property ID</dt>
                        <dd className="text-sm">#{property.id}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="location" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Location Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Full Address</dt>
                        <dd className="text-sm">{property.address || 'Not specified'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">City</dt>
                        <dd className="text-sm">{property.city}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">State/Province</dt>
                        <dd className="text-sm">{property.state_province}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Country</dt>
                        <dd className="text-sm">{property.country}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card>
              <CardHeader>
                <CardDescription>
                  {property.transaction_type === 'rent' ? 'Monthly Rent' : 'Sale Price'}
                </CardDescription>
                <CardTitle className="text-3xl">
                  {formatPrice(property.price)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg" onClick={() => setShowContactInfo(!showContactInfo)}>
                  {showContactInfo ? 'Hide Contact Info' : 'Show Contact Info'}
                </Button>
                
                {showContactInfo && property.contact_info && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-medium">Contact Information</p>
                    <p className="text-sm text-muted-foreground break-all">{property.contact_info}</p>
                    {property.contact_info.startsWith('http') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => window.open(property.contact_info, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View on Original Site
                      </Button>
                    )}
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Phone className="mr-2 h-4 w-4" />
                    Call Agent
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Agent/Source Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Listed by</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Building className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium capitalize">{property.source}</p>
                    <p className="text-sm text-muted-foreground">Property Platform</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule a Tour
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Info className="mr-2 h-4 w-4" />
                  Request More Info
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}