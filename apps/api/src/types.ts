export interface PropertySearchFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: 'house' | 'apartment' | 'condo' | 'commercial' | 'land';
  minArea?: number;
  maxArea?: number;
}