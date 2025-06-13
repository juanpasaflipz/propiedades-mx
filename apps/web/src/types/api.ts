export interface SearchFilters {
  country?: string;
  city?: string;
  transactionType?: 'rent' | 'sale';
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  minBedrooms?: number;
  minBathrooms?: number;
}

export interface PropertyListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: {
    city: string;
    country: string;
    address?: string;
  };
  propertyType: string;
  transactionType: 'rent' | 'sale';
  bedrooms: number;
  bathrooms: number;
  area?: number;
  imageUrl?: string;
  listingUrl: string;
  description?: string;
  publishedAt?: string;
}

export interface SearchResponse {
  listings: PropertyListing[];
  total: number;
  page: number;
  totalPages: number;
}