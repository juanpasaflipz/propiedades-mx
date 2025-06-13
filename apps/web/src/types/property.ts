export interface Property {
  id: string;
  source: string;
  country: string;
  state_province: string;
  city: string;
  neighborhood: string;
  postal_code: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  transaction_type: 'rent' | 'sale';
  price: {
    amount: number;
    currency: string;
  };
  property_type: 'house' | 'apartment' | 'condo' | 'commercial' | 'land';
  bedrooms: number;
  bathrooms: number;
  area_sqm: number;
  lot_size_sqm: number;
  amenities: string[];
  images: string[];
  description: string;
  contact_info: string;
  listing_date: string;
  last_updated: string;
}

export interface PropertySearchFilters {
  country?: string;
  city?: string;
  area?: string;
  zipCode?: string;
  transactionType?: string;
  minPrice?: string;
  maxPrice?: string;
  propertyType?: string;
  minBedrooms?: string;
  minBathrooms?: string;
} 