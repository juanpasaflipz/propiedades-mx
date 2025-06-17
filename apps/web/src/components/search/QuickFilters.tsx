'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

const propertyTypes = [
  { value: 'all', label: 'All Types' },
  { value: 'house', label: 'Houses' },
  { value: 'apartment', label: 'Apartments' },
  { value: 'condo', label: 'Condos' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
];

const priceRanges = [
  { value: 'all', label: 'Any Price' },
  { value: '0-1000000', label: 'Under $1M' },
  { value: '1000000-3000000', label: '$1M - $3M' },
  { value: '3000000-5000000', label: '$3M - $5M' },
  { value: '5000000-10000000', label: '$5M - $10M' },
  { value: '10000000+', label: 'Over $10M' },
];

const bedroomOptions = [
  { value: 'all', label: 'Any Beds' },
  { value: '1', label: '1+ Bed' },
  { value: '2', label: '2+ Beds' },
  { value: '3', label: '3+ Beds' },
  { value: '4', label: '4+ Beds' },
  { value: '5', label: '5+ Beds' },
];

export function QuickFilters() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [bedrooms, setBedrooms] = useState('all');

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (city) params.append('city', city);
    if (propertyType !== 'all') params.append('propertyType', propertyType);
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-');
      if (min !== 'all') params.append('minPrice', min);
      if (max && max !== '+') params.append('maxPrice', max);
    }
    if (bedrooms !== 'all') params.append('minBedrooms', bedrooms);
    
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <div className="w-full bg-card rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Find Your Dream Property</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Input
          placeholder="Enter city..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        
        <Select value={propertyType} onValueChange={setPropertyType}>
          <SelectTrigger>
            <SelectValue placeholder="Property Type" />
          </SelectTrigger>
          <SelectContent>
            {propertyTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={priceRange} onValueChange={setPriceRange}>
          <SelectTrigger>
            <SelectValue placeholder="Price Range" />
          </SelectTrigger>
          <SelectContent>
            {priceRanges.map(range => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={bedrooms} onValueChange={setBedrooms}>
          <SelectTrigger>
            <SelectValue placeholder="Bedrooms" />
          </SelectTrigger>
          <SelectContent>
            {bedroomOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button onClick={handleSearch} className="w-full">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
}