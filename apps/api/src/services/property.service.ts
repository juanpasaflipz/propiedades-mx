import { Pool } from 'pg';
import { Property } from '../models/property.model';
import { Logger } from '../utils/logger';
import { PropertySearch } from '../validation/property.schemas';

export class PropertyService {
  constructor(
    private pool: Pool,
    private logger: Logger
  ) {}

  private mapDbRowToProperty(row: any): Property {
    // Parse price from string (could be "1,500,000" or "1500000")
    const parsePrice = (priceStr: string | null): number => {
      if (!priceStr) return 0;
      const numStr = priceStr.replace(/[^0-9.]/g, '');
      return parseFloat(numStr) || 0;
    };

    return {
      id: row.id.toString(),
      source: row.source,
      country: row.country || 'Mexico',
      state_province: row.state || '',
      city: row.city || '',
      neighborhood: '',
      postal_code: '',
      address: row.location || '',
      coordinates: {
        lat: 0,
        lng: 0
      },
      transaction_type: 'sale',
      price: {
        amount: parsePrice(row.price),
        currency: row.currency || 'MXN'
      },
      property_type: row.property_type || 'house',
      bedrooms: row.bedrooms || 0,
      bathrooms: row.bathrooms || 0,
      area_sqm: 0, // Not available in current schema
      lot_size_sqm: 0, // Not available in current schema
      amenities: [],
      images: row.image_url ? [row.image_url] : [],
      description: row.description || row.title || '',
      contact_info: row.link || '',
      listing_date: row.created_at || new Date().toISOString(),
      last_updated: row.updated_at || row.last_seen_at || new Date().toISOString()
    };
  }

  async searchProperties(filters: PropertySearch): Promise<Property[]> {
    const startTime = Date.now();
    const queryLogger = this.logger.child({ 
      operation: 'searchProperties',
      filters 
    });

    try {
      queryLogger.info('Searching properties');

      // Build dynamic query
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      // Location filters
      if (filters.country) {
        conditions.push(`LOWER(country) = LOWER($${paramIndex})`);
        params.push(filters.country);
        paramIndex++;
      }

      if (filters.city) {
        conditions.push(`LOWER(city) = LOWER($${paramIndex})`);
        params.push(filters.city);
        paramIndex++;
      }

      if (filters.state) {
        conditions.push(`LOWER(state) = LOWER($${paramIndex})`);
        params.push(filters.state);
        paramIndex++;
      }

      // Skip neighborhood and zipCode as they don't exist in current schema

      // Property filters
      if (filters.propertyType) {
        conditions.push(`property_type = $${paramIndex}`);
        params.push(filters.propertyType);
        paramIndex++;
      }

      if (filters.transactionType) {
        conditions.push(`transaction_type = $${paramIndex}`);
        params.push(filters.transactionType);
        paramIndex++;
      }

      // Price filters - need to handle string prices
      // Skip price filters for now since price is stored as string

      // Size filters
      if (filters.minBedrooms) {
        conditions.push(`bedrooms >= $${paramIndex}`);
        params.push(filters.minBedrooms);
        paramIndex++;
      }

      if (filters.maxBedrooms) {
        conditions.push(`bedrooms <= $${paramIndex}`);
        params.push(filters.maxBedrooms);
        paramIndex++;
      }

      if (filters.minBathrooms) {
        conditions.push(`bathrooms >= $${paramIndex}`);
        params.push(filters.minBathrooms);
        paramIndex++;
      }

      if (filters.maxBathrooms) {
        conditions.push(`bathrooms <= $${paramIndex}`);
        params.push(filters.maxBathrooms);
        paramIndex++;
      }

      // Skip area filters as area_sqm doesn't exist in current schema

      // Build query
      let query = 'SELECT * FROM properties';
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Add sorting
      const sortColumn = this.getSortColumn(filters.sortBy);
      query += ` ORDER BY ${sortColumn} ${filters.sortOrder || 'DESC'}`;

      // Add pagination
      const limit = filters.limit || 20;
      const offset = ((filters.page || 1) - 1) * limit;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      // Execute query
      queryLogger.debug('Executing query', { query, params });
      const result = await this.pool.query(query, params);
      
      const properties = result.rows.map(row => this.mapDbRowToProperty(row));
      
      const duration = Date.now() - startTime;
      queryLogger.info('Search completed', { 
        count: properties.length,
        duration
      });
      this.logger.performance('searchProperties', duration, { 
        resultCount: properties.length 
      });

      return properties;
    } catch (error: any) {
      queryLogger.error('Search failed', error);
      throw error;
    }
  }

  async getPropertyById(id: string): Promise<Property | null> {
    const startTime = Date.now();
    this.logger.info('Getting property by ID', { id });

    try {
      const query = 'SELECT * FROM properties WHERE id = $1';
      const result = await this.pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        this.logger.info('Property not found', { id });
        return null;
      }

      const property = this.mapDbRowToProperty(result.rows[0]);
      
      const duration = Date.now() - startTime;
      this.logger.performance('getPropertyById', duration);
      
      return property;
    } catch (error: any) {
      this.logger.error('Failed to get property by ID', error, { id });
      throw error;
    }
  }

  async getPropertiesByCountry(country: string): Promise<Property[]> {
    this.logger.info('Getting properties by country', { country });

    try {
      const query = 'SELECT * FROM properties WHERE LOWER(country) = LOWER($1) LIMIT 100';
      const result = await this.pool.query(query, [country]);
      
      const properties = result.rows.map(row => this.mapDbRowToProperty(row));
      
      this.logger.info('Properties by country retrieved', { 
        country, 
        count: properties.length 
      });
      
      return properties;
    } catch (error: any) {
      this.logger.error('Failed to get properties by country', error, { country });
      throw error;
    }
  }

  async getPropertiesByCity(city: string): Promise<Property[]> {
    this.logger.info('Getting properties by city', { city });

    try {
      const query = 'SELECT * FROM properties WHERE LOWER(city) = LOWER($1) LIMIT 100';
      const result = await this.pool.query(query, [city]);
      
      const properties = result.rows.map(row => this.mapDbRowToProperty(row));
      
      this.logger.info('Properties by city retrieved', { 
        city, 
        count: properties.length 
      });
      
      return properties;
    } catch (error: any) {
      this.logger.error('Failed to get properties by city', error, { city });
      throw error;
    }
  }

  async getPropertyStats(): Promise<any> {
    this.logger.info('Getting property statistics');

    try {
      const queries = {
        total: 'SELECT COUNT(*) as count FROM properties',
        byType: 'SELECT property_type, COUNT(*) as count FROM properties GROUP BY property_type',
        byCity: 'SELECT city, COUNT(*) as count FROM properties GROUP BY city ORDER BY count DESC LIMIT 10',
        priceRange: 'SELECT COUNT(*) as count FROM properties' // Price is stored as string, can't do MIN/MAX/AVG
      };

      const [total, byType, byCity, priceRange] = await Promise.all([
        this.pool.query(queries.total),
        this.pool.query(queries.byType),
        this.pool.query(queries.byCity),
        this.pool.query(queries.priceRange)
      ]);

      const stats = {
        totalProperties: parseInt(total.rows[0].count),
        byPropertyType: byType.rows.reduce((acc, row) => {
          acc[row.property_type] = parseInt(row.count);
          return acc;
        }, {}),
        topCities: byCity.rows.map(row => ({
          city: row.city,
          count: parseInt(row.count)
        })),
        priceStats: {
          min: 0,
          max: 0,
          avg: 0
        }
      };

      this.logger.info('Property statistics retrieved', stats);
      return stats;
    } catch (error: any) {
      this.logger.error('Failed to get property statistics', error);
      throw error;
    }
  }

  private getSortColumn(sortBy?: string): string {
    const sortMap: Record<string, string> = {
      price: 'price',
      date: 'created_at',
      area: 'size',
      bedrooms: 'bedrooms'
    };

    return sortMap[sortBy || 'date'] || 'created_at';
  }
}