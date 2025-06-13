export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  property_type: PropertyType;
  listing_type: ListingType;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  area_sqft?: number;
  year_built?: number;
  features: string[];
  images: string[];
  source: string;
  source_url: string;
  source_id: string;
  available: boolean;
  created_at: Date;
  updated_at: Date;
}

export type PropertyType = 
  | 'house'
  | 'apartment'
  | 'condo'
  | 'townhouse'
  | 'land'
  | 'commercial'
  | 'other';

export type ListingType = 'sale' | 'rent';

export interface PropertySearchParams {
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  property_type?: PropertyType;
  listing_type?: ListingType;
  price_min?: number;
  price_max?: number;
  bedrooms_min?: number;
  bedrooms_max?: number;
  bathrooms_min?: number;
  bathrooms_max?: number;
  area_min?: number;
  area_max?: number;
  features?: string[];
  limit?: number;
  offset?: number;
  sort_by?: 'price' | 'created_at' | 'area';
  sort_order?: 'asc' | 'desc';
}