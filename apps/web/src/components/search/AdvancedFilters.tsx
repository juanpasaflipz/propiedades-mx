'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, X, ChevronDown, ChevronUp, Search, 
  Home, DollarSign, Bed, Bath, Square, MapPin,
  Building, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FilterState {
  // Location
  country: string;
  state: string;
  city: string;
  neighborhood: string;
  
  // Price
  minPrice: number;
  maxPrice: number;
  priceType: 'sale' | 'rent' | 'both';
  
  // Property Details
  propertyType: string;
  minBedrooms: number;
  maxBedrooms: number;
  minBathrooms: number;
  maxBathrooms: number;
  
  // Size
  minArea: number;
  maxArea: number;
  
  // Transaction
  transactionType: string;
  
  // Amenities
  amenities: string[];
}

interface AdvancedFiltersProps {
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

const defaultFilters: FilterState = {
  country: 'Mexico',
  state: '',
  city: '',
  neighborhood: '',
  minPrice: 0,
  maxPrice: 50000000,
  priceType: 'both',
  propertyType: '',
  minBedrooms: 0,
  maxBedrooms: 10,
  minBathrooms: 0,
  maxBathrooms: 10,
  minArea: 0,
  maxArea: 1000,
  transactionType: '',
  amenities: [],
};

const propertyTypes = [
  { value: 'house', label: 'House', icon: '🏠' },
  { value: 'apartment', label: 'Apartment', icon: '🏢' },
  { value: 'condo', label: 'Condo', icon: '🏙️' },
  { value: 'land', label: 'Land', icon: '🏞️' },
  { value: 'commercial', label: 'Commercial', icon: '🏪' },
];

const amenitiesList = [
  'Pool', 'Garden', 'Parking', 'Security', 'Gym', 
  'Elevator', 'Terrace', 'Storage', 'Furnished', 'Pets Allowed'
];

const popularCities = [
  'Ciudad de México', 'Guadalajara', 'Monterrey', 'Puebla', 
  'Tijuana', 'León', 'Juárez', 'Zapopan', 'Mérida', 'Querétaro'
];

export function AdvancedFilters({ onFiltersChange, onClose, isOpen = true }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [priceRange, setPriceRange] = useState([filters.minPrice, filters.maxPrice]);
  const [bedroomRange, setBedroomRange] = useState([filters.minBedrooms, filters.maxBedrooms]);
  const [bathroomRange, setBathroomRange] = useState([filters.minBathrooms, filters.maxBathrooms]);
  const [areaRange, setAreaRange] = useState([filters.minArea, filters.maxArea]);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.state) count++;
    if (filters.city) count++;
    if (filters.neighborhood) count++;
    if (filters.minPrice > 0 || filters.maxPrice < 50000000) count++;
    if (filters.propertyType) count++;
    if (filters.minBedrooms > 0 || filters.maxBedrooms < 10) count++;
    if (filters.minBathrooms > 0 || filters.maxBathrooms < 10) count++;
    if (filters.minArea > 0 || filters.maxArea < 1000) count++;
    if (filters.transactionType) count++;
    if (filters.amenities.length > 0) count += filters.amenities.length;
    setActiveFiltersCount(count);
  }, [filters]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const toggleAmenity = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    updateFilter('amenities', newAmenities);
  };

  const applyFilters = () => {
    // Update range values
    const finalFilters = {
      ...filters,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      minBedrooms: bedroomRange[0],
      maxBedrooms: bedroomRange[1],
      minBathrooms: bathroomRange[0],
      maxBathrooms: bathroomRange[1],
      minArea: areaRange[0],
      maxArea: areaRange[1],
    };
    onFiltersChange(finalFilters);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setPriceRange([defaultFilters.minPrice, defaultFilters.maxPrice]);
    setBedroomRange([defaultFilters.minBedrooms, defaultFilters.maxBedrooms]);
    setBathroomRange([defaultFilters.minBathrooms, defaultFilters.maxBathrooms]);
    setAreaRange([defaultFilters.minArea, defaultFilters.maxArea]);
  };

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          className="fixed inset-y-0 left-0 z-50 w-full max-w-md bg-background border-r shadow-xl overflow-y-auto"
        >
          <div className="sticky top-0 bg-background border-b z-10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Advanced Filters</h2>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">{activeFiltersCount} active</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                {onClose && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Location Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>City</Label>
                  <Select value={filters.city} onValueChange={(value) => updateFilter('city', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Cities</SelectItem>
                      {popularCities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Neighborhood</Label>
                  <Input
                    placeholder="e.g., Polanco, Roma Norte"
                    value={filters.neighborhood}
                    onChange={(e) => updateFilter('neighborhood', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Price Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price Range
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={filters.priceType === 'sale' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('priceType', 'sale')}
                  >
                    For Sale
                  </Button>
                  <Button
                    variant={filters.priceType === 'rent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('priceType', 'rent')}
                  >
                    For Rent
                  </Button>
                  <Button
                    variant={filters.priceType === 'both' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('priceType', 'both')}
                  >
                    Both
                  </Button>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {formatPrice(priceRange[0])}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatPrice(priceRange[1])}
                    </span>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={50000000}
                    step={100000}
                    className="mb-4"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Min Price</Label>
                    <Input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Max Price</Label>
                    <Input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 50000000])}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Property Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {propertyTypes.map(type => (
                    <Button
                      key={type.value}
                      variant={filters.propertyType === type.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateFilter('propertyType', filters.propertyType === type.value ? '' : type.value)}
                      className="justify-start"
                    >
                      <span className="mr-2">{type.icon}</span>
                      {type.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bedrooms & Bathrooms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Rooms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Bedrooms</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm w-8">{bedroomRange[0]}</span>
                    <Slider
                      value={bedroomRange}
                      onValueChange={setBedroomRange}
                      min={0}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm w-8">{bedroomRange[1]}+</span>
                  </div>
                </div>

                <div>
                  <Label>Bathrooms</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm w-8">{bathroomRange[0]}</span>
                    <Slider
                      value={bathroomRange}
                      onValueChange={setBathroomRange}
                      min={0}
                      max={10}
                      step={0.5}
                      className="flex-1"
                    />
                    <span className="text-sm w-8">{bathroomRange[1]}+</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Property Size */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  Property Size (m²)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-sm w-12">{areaRange[0]}</span>
                  <Slider
                    value={areaRange}
                    onValueChange={setAreaRange}
                    min={0}
                    max={1000}
                    step={10}
                    className="flex-1"
                  />
                  <span className="text-sm w-12">{areaRange[1]}+</span>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {amenitiesList.map(amenity => (
                    <Badge
                      key={amenity}
                      variant={filters.amenities.includes(amenity) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleAmenity(amenity)}
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Apply Filters Button */}
          <div className="sticky bottom-0 bg-background border-t p-4">
            <Button 
              className="w-full" 
              size="lg"
              onClick={applyFilters}
            >
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}