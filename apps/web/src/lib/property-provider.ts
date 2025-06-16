import { SearchFilters, PropertyListing, SearchResponse } from '@/types/api';
import axios from 'axios';

interface CacheEntry {
  data: SearchResponse;
  timestamp: number;
}

export class PropertyProvider {
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async searchProperties(filters: SearchFilters, page: number, limit: number): Promise<SearchResponse> {
    const cacheKey = this.getCacheKey(filters, page, limit);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Try backend API first, then fall back to mock data
      const providers = [
        () => this.searchBackendAPI(filters, page, limit),
        () => this.generateMockData(filters, page, limit),
      ];

      for (const provider of providers) {
        try {
          console.log('Trying provider:', provider.name);
          const result = await provider();
          if (result.listings.length > 0) {
            console.log(`Provider ${provider.name} returned ${result.listings.length} listings`);
            this.setCache(cacheKey, result);
            return result;
          }
        } catch (error) {
          console.error(`Provider ${provider.name} failed:`, error);
          continue;
        }
      }

      // If all providers fail, return empty result
      return {
        listings: [],
        total: 0,
        page,
        totalPages: 0,
      };
    } catch (error) {
      console.error('Property search error:', error);
      throw error;
    }
  }

  // MercadoLibre removed due to authentication complexity
  private async searchMercadoLibre(filters: SearchFilters, page: number, limit: number): Promise<SearchResponse> {
    console.log('MercadoLibre search with filters:', filters);
    
    if (!filters.country) {
      throw new Error('Country is required for MercadoLibre search');
    }

    const countryMap: Record<string, string> = {
      'Mexico': 'MLM',
      'Argentina': 'MLA',
      'Brazil': 'MLB',
      'Colombia': 'MCO',
      'Chile': 'MLC',
      'Peru': 'MPE',
      'Ecuador': 'MEC',
    };

    const siteId = countryMap[filters.country];
    if (!siteId) {
      throw new Error('Country not supported by MercadoLibre');
    }

    // Real estate categories per country
    const realEstateCategories: Record<string, string> = {
      'MLM': 'MLM1459', // Mexico
      'MLA': 'MLA1459', // Argentina
      'MLB': 'MLB1459', // Brazil
      'MCO': 'MCO1459', // Colombia
      'MLC': 'MLC1459', // Chile
      'MPE': 'MPE1459', // Peru
      'MEC': 'MEC1459', // Ecuador
    };

    const params = new URLSearchParams({
      category: realEstateCategories[siteId],
      offset: String((page - 1) * limit),
      limit: String(limit),
    });

    if (filters.city) {
      params.append('city', filters.city);
    }

    if (filters.minPrice) {
      params.append('price', `${filters.minPrice}-*`);
    } else if (filters.maxPrice) {
      params.append('price', `*-${filters.maxPrice}`);
    }

    const url = `https://api.mercadolibre.com/sites/${siteId}/search?${params}`;
    console.log('MercadoLibre API URL:', url);
    
    const response = await axios.get(url);
    
    return this.normalizeMercadoLibreResponse(response.data, page, limit);
  }

  private normalizeMercadoLibreResponse(data: any, page: number, limit: number): SearchResponse {
    const listings: PropertyListing[] = data.results.map((item: any) => {
      // Get the best quality image available
      let imageUrl = '/placeholder-property.svg';
      
      // Try to get the highest quality image from pictures array first
      if (item.pictures && item.pictures.length > 0) {
        imageUrl = item.pictures[0].secure_url || item.pictures[0].url;
      } else if (item.thumbnail) {
        // Fallback to thumbnail and convert to higher quality
        imageUrl = item.thumbnail
          .replace('-I.jpg', '-O.jpg')  // Original size
          .replace('-V.jpg', '-O.jpg')  // From variant to original
          .replace('-D.jpg', '-O.jpg')  // From default to original
          .replace('http://', 'https://');
      }
      
      console.log('Image URL for property:', item.title, ':', imageUrl);
      
      return {
        id: item.id,
        title: item.title,
        price: item.price,
        currency: item.currency_id,
        location: {
          city: item.address?.city_name || 'Unknown',
          country: this.getCountryFromSiteId(item.site_id),
          address: item.address?.address_line,
        },
        propertyType: this.extractPropertyType(item.attributes),
        transactionType: item.buying_mode === 'rent' ? 'rent' : 'sale',
        bedrooms: this.extractNumericAttribute(item.attributes, 'bedrooms') || 0,
        bathrooms: this.extractNumericAttribute(item.attributes, 'bathrooms') || 0,
        area: this.extractNumericAttribute(item.attributes, 'surface_total'),
        imageUrl,
        listingUrl: item.permalink,
        description: item.title,
        publishedAt: item.date_created,
      };
    });

    return {
      listings,
      total: data.paging.total,
      page,
      totalPages: Math.ceil(data.paging.total / limit),
    };
  }

  private async searchEasyBroker(filters: SearchFilters, page: number, limit: number): Promise<SearchResponse> {
    if (!process.env.EASYBROKER_API_KEY) {
      throw new Error('EasyBroker API key not configured');
    }

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    // Add filters
    if (filters.country) params.append('search[country]', filters.country.toLowerCase());
    if (filters.city) params.append('search[city]', filters.city);
    if (filters.transactionType) params.append('search[operation_type]', filters.transactionType);
    if (filters.minPrice) params.append('search[min_price]', String(filters.minPrice));
    if (filters.maxPrice) params.append('search[max_price]', String(filters.maxPrice));
    if (filters.propertyType) params.append('search[property_type]', filters.propertyType);
    if (filters.minBedrooms) params.append('search[min_bedrooms]', String(filters.minBedrooms));
    if (filters.minBathrooms) params.append('search[min_bathrooms]', String(filters.minBathrooms));

    const response = await axios.get(`https://api.easybroker.com/v1/properties?${params}`, {
      headers: {
        'X-Authorization': process.env.EASYBROKER_API_KEY,
        'Accept': 'application/json',
      },
    });

    return this.normalizeEasyBrokerResponse(response.data, page, limit);
  }

  private normalizeEasyBrokerResponse(data: any, page: number, limit: number): SearchResponse {
    const listings: PropertyListing[] = data.content.map((item: any) => {
      // Debug log for images
      console.log('EasyBroker item images:', item.public_id, item.images);
      
      return {
      id: item.public_id,
      title: item.title,
      price: item.operations?.[0]?.amount || 0,
      currency: item.operations?.[0]?.currency || 'USD',
      location: {
        city: item.location?.city || 'Unknown',
        country: item.location?.country || 'Mexico',
        address: item.location?.street,
      },
      propertyType: item.property_type || 'house',
      transactionType: item.operations?.[0]?.type === 'rental' ? 'rent' : 'sale',
      bedrooms: item.bedrooms || 0,
      bathrooms: item.bathrooms || 0,
      area: item.construction_size || item.lot_size,
      imageUrl: item.images?.[0]?.url || '/placeholder-property.svg',
      listingUrl: item.public_url || `https://www.easybroker.com/properties/${item.public_id}`,
      description: item.description,
      publishedAt: item.created_at,
    }});

    return {
      listings,
      total: data.pagination?.total || listings.length,
      page,
      totalPages: data.pagination?.total_pages || Math.ceil(listings.length / limit),
    };
  }

  private async searchBackendAPI(filters: SearchFilters, page: number, limit: number): Promise<SearchResponse> {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
    
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    
    try {
      const response = await axios.get(`${backendUrl}/api/properties/search?${params}`);
      
      // The backend already returns data in the correct format
      return response.data;
    } catch (error) {
      console.error('Backend API error:', error);
      throw error;
    }
  }

  private generateMockData(filters: SearchFilters, page: number, limit: number): SearchResponse {
    const total = 50;
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, total);
    
    const listings: PropertyListing[] = [];
    
    // More realistic property titles
    const propertyTitles = [
      'Luxury Penthouse with Ocean Views',
      'Modern Downtown Loft',
      'Colonial House in Historic District',
      'Beachfront Villa with Private Pool',
      'Mountain Retreat with Panoramic Views',
      'Garden Apartment in Prime Location',
      'Executive Suite in Business District',
      'Family Home with Large Backyard',
      'Contemporary Studio Near Metro',
      'Renovated Condo in Gated Community',
    ];
    
    for (let i = startIndex; i < endIndex; i++) {
      const titleIndex = i % propertyTitles.length;
      // Use deterministic values based on index to avoid hydration mismatches
      const priceBase = ((i * 12345) % 450000) + 50000;
      const bedroomBase = ((i * 7) % 4) + 1;
      const bathroomBase = ((i * 5) % 3) + 1;
      const areaBase = ((i * 31) % 150) + 50;
      
      listings.push({
        id: `mock-${i}`,
        title: propertyTitles[titleIndex],
        price: priceBase,
        currency: 'USD',
        location: `${filters.city || 'Mexico City'}, ${filters.country || 'Mexico'}`,
        propertyType: filters.propertyType || 'house',
        transactionType: filters.transactionType || 'sale',
        bedrooms: Math.max(filters.minBedrooms || 1, bedroomBase),
        bathrooms: Math.max(filters.minBathrooms || 1, bathroomBase),
        area: areaBase,
        imageUrl: '/placeholder-property.svg',
        listingUrl: `https://example.com/property-${i}`,
        description: 'A wonderful property in a great location',
      });
    }

    return {
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  private getCacheKey(filters: SearchFilters, page: number, limit: number): string {
    return JSON.stringify({ ...filters, page, limit });
  }

  private getFromCache(key: string): SearchResponse | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.cacheTimeout) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: SearchResponse): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCountryFromSiteId(siteId: string): string {
    const map: Record<string, string> = {
      'MLM': 'Mexico',
      'MLA': 'Argentina',
      'MLB': 'Brazil',
      'MCO': 'Colombia',
      'MLC': 'Chile',
      'MPE': 'Peru',
      'MEC': 'Ecuador',
    };
    return map[siteId] || 'Unknown';
  }

  private extractPropertyType(attributes: any[]): string {
    const typeAttr = attributes.find((attr: any) => attr.id === 'property_type');
    return typeAttr?.value_name?.toLowerCase() || 'house';
  }

  private extractNumericAttribute(attributes: any[], id: string): number | undefined {
    const attr = attributes.find((attr: any) => attr.id === id);
    return attr?.value_struct?.number;
  }
}