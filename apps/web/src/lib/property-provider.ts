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
    console.log('PropertyProvider.searchProperties called with filters:', filters);
    
    const cacheKey = this.getCacheKey(filters, page, limit);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      console.log('Returning cached results for key:', cacheKey);
      return cached;
    }

    try {
      // Only use backend API, no mock data fallback
      const providers = [
        () => this.searchBackendAPI(filters, page, limit),
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
    // Generate varied mock properties
    const allProperties: PropertyListing[] = [];
    
    // Define mock properties with various characteristics
    const mockProperties = [
      // Polanco properties
      { title: 'Penthouse de Lujo en Polanco', location: 'Polanco, Ciudad de México', bedrooms: 3, bathrooms: 3, price: 8500000, type: 'penthouse', transaction: 'sale' as const, area: 250, imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800' },
      { title: 'Casa Moderna en Polanco', location: 'Polanco, Ciudad de México', bedrooms: 4, bathrooms: 3, price: 45000, type: 'house', transaction: 'rent' as const, area: 320, imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800' },
      { title: 'Departamento con Jardín en Polanco', location: 'Polanco, Ciudad de México', bedrooms: 2, bathrooms: 2, price: 35000, type: 'apartment', transaction: 'rent' as const, area: 150, imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800' },
      { title: 'Departamento Ejecutivo en Polanco', location: 'Polanco, Ciudad de México', bedrooms: 1, bathrooms: 1, price: 28000, type: 'apartment', transaction: 'rent' as const, area: 90, imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800' },
      
      // Condesa properties
      { title: 'Loft de Artista en Condesa', location: 'Condesa, Ciudad de México', bedrooms: 1, bathrooms: 1, price: 22000, type: 'apartment', transaction: 'rent' as const, area: 85, imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800' },
      { title: 'Casa Colonial en Condesa', location: 'Condesa, Ciudad de México', bedrooms: 3, bathrooms: 2, price: 5200000, type: 'house', transaction: 'sale' as const, area: 280, imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800' },
      { title: 'Studio Moderno en Condesa', location: 'Condesa, Ciudad de México', bedrooms: 1, bathrooms: 1, price: 18000, type: 'apartment', transaction: 'rent' as const, area: 55, imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800' },
      { title: 'Departamento Pet-Friendly en Condesa', location: 'Condesa, Ciudad de México', bedrooms: 2, bathrooms: 2, price: 30000, type: 'apartment', transaction: 'rent' as const, area: 120, imageUrl: 'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?w=800' },
      
      // Roma Norte properties
      { title: 'Departamento Renovado en Roma Norte', location: 'Roma Norte, Ciudad de México', bedrooms: 2, bathrooms: 1, price: 25000, type: 'apartment', transaction: 'rent' as const, area: 100 },
      { title: 'Penthouse con Terraza en Roma Norte', location: 'Roma Norte, Ciudad de México', bedrooms: 2, bathrooms: 2, price: 4800000, type: 'penthouse', transaction: 'sale' as const, area: 180 },
      { title: 'Departamento Vintage en Roma Norte', location: 'Roma Norte, Ciudad de México', bedrooms: 3, bathrooms: 2, price: 38000, type: 'apartment', transaction: 'rent' as const, area: 160 },
      
      // Other CDMX areas
      { title: 'Casa en Coyoacán con Jardín', location: 'Coyoacán, Ciudad de México', bedrooms: 3, bathrooms: 2, price: 7200000, type: 'house', transaction: 'sale' as const, area: 280 },
      { title: 'Departamento en Del Valle', location: 'Del Valle, Ciudad de México', bedrooms: 2, bathrooms: 2, price: 28000, type: 'apartment', transaction: 'rent' as const, area: 110 },
      { title: 'Oficina en Santa Fe', location: 'Santa Fe, Ciudad de México', bedrooms: 0, bathrooms: 2, price: 45000, type: 'commercial', transaction: 'rent' as const, area: 200 },
      
      // Beach properties
      { title: 'Villa Frente al Mar en Cancún', location: 'Cancún, Quintana Roo', bedrooms: 5, bathrooms: 4, price: 12500000, type: 'villa', transaction: 'sale' as const, area: 450 },
      { title: 'Condominio en Playa del Carmen', location: 'Playa del Carmen, Quintana Roo', bedrooms: 2, bathrooms: 2, price: 5800000, type: 'condo', transaction: 'sale' as const, area: 120 },
      { title: 'Casa de Playa en Tulum', location: 'Tulum, Quintana Roo', bedrooms: 4, bathrooms: 4, price: 9500000, type: 'house', transaction: 'sale' as const, area: 380 },
      { title: 'Departamento Vista al Mar en Puerto Vallarta', location: 'Puerto Vallarta, Jalisco', bedrooms: 3, bathrooms: 2, price: 6500000, type: 'apartment', transaction: 'sale' as const, area: 180 },
      
      // Other cities
      { title: 'Casa de Montaña en Valle de Bravo', location: 'Valle de Bravo, Estado de México', bedrooms: 6, bathrooms: 5, price: 15000000, type: 'house', transaction: 'sale' as const, area: 600 },
      { title: 'Loft en Centro de Guadalajara', location: 'Guadalajara, Jalisco', bedrooms: 1, bathrooms: 1, price: 15000, type: 'apartment', transaction: 'rent' as const, area: 70 },
      { title: 'Casa Familiar en Monterrey', location: 'Monterrey, Nuevo León', bedrooms: 4, bathrooms: 3, price: 6800000, type: 'house', transaction: 'sale' as const, area: 350 },
      { title: 'Casa Colonial en San Miguel de Allende', location: 'San Miguel de Allende, Guanajuato', bedrooms: 5, bathrooms: 4, price: 9200000, type: 'house', transaction: 'sale' as const, area: 420 },
      { title: 'Departamento en Querétaro', location: 'Querétaro, Querétaro', bedrooms: 2, bathrooms: 1, price: 20000, type: 'apartment', transaction: 'rent' as const, area: 95 },
      { title: 'Casa en Mérida Centro', location: 'Mérida, Yucatán', bedrooms: 3, bathrooms: 2, price: 4500000, type: 'house', transaction: 'sale' as const, area: 250 },
    ];
    
    // Generate properties with proper filtering
    let id = 0;
    for (const prop of mockProperties) {
      // Apply filters
      if (filters.city && !prop.location.toLowerCase().includes(filters.city.toLowerCase())) continue;
      if (filters.propertyType && filters.propertyType !== 'all' && prop.type !== filters.propertyType) continue;
      if (filters.transactionType && prop.transaction !== filters.transactionType) continue;
      if (filters.minBedrooms && prop.bedrooms < filters.minBedrooms) continue;
      if (filters.minBathrooms && prop.bathrooms < filters.minBathrooms) continue;
      if (filters.minPrice && prop.price < filters.minPrice) continue;
      if (filters.maxPrice && prop.price > filters.maxPrice) continue;
      
      allProperties.push({
        id: `mock-${id++}`,
        title: prop.title,
        price: prop.price,
        currency: prop.transaction === 'rent' ? 'MXN' : 'MXN',
        location: prop.location,
        propertyType: prop.type,
        transactionType: prop.transaction,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        area: prop.area,
        imageUrl: prop.imageUrl || '/placeholder-property.svg',
        listingUrl: `https://example.com/property-${id}`,
        description: `Hermosa propiedad en ${prop.location}`,
      });
    }
    
    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, allProperties.length);
    const listings = allProperties.slice(startIndex, endIndex);

    return {
      listings,
      total: allProperties.length,
      page,
      totalPages: Math.ceil(allProperties.length / limit),
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