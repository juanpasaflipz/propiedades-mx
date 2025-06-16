export interface FilterObject {
  location: string | null;
  priceRange: {
    min: number;
    max: number;
  } | null;
  bedrooms: number | null;
  bathrooms: number | null;
  features: string[] | null;
  propertyType: string | null;
  transactionType: 'sale' | 'rent' | null;
}

export interface AIProvider {
  name: 'claude' | 'openai';
  apiKey: string;
  endpoint: string;
  model: string;
}

export interface AISearchResponse {
  filters: FilterObject;
  confidence?: number;
  rawQuery: string;
}