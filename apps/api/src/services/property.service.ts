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
    return {
      id: row.id.toString(),
      source: row.source,
      country: row.country || 'Mexico',
      state_province: row.state_province || row.state || '',
      city: row.city || '',
      neighborhood: row.neighborhood || '',
      postal_code: row.postal_code || '',
      address: row.address || row.location || '',
      coordinates: {
        lat: row.coordinates_lat || 0,
        lng: row.coordinates_lng || 0
      },
      transaction_type: row.transaction_type || 'sale',
      price: {
        amount: row.price_amount ? parseFloat(row.price_amount) : 0,
        currency: row.price_currency || row.currency || 'MXN'
      },
      property_type: row.property_type || 'house',
      bedrooms: row.bedrooms || 0,
      bathrooms: row.bathrooms || 0,
      area_sqm: row.area_sqm ? parseFloat(row.area_sqm) : 0,
      lot_size_sqm: row.lot_size_sqm ? parseFloat(row.lot_size_sqm) : null,
      amenities: row.amenities || [],
      images: row.images || [],
      description: row.description || row.title || '',
      contact_info: row.contact_info || row.link || '',
      listing_date: row.listing_date || row.created_at,
      last_updated: row.last_updated || row.updated_at
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
        conditions.push(`LOWER(state_province) = LOWER($${paramIndex})`);
        params.push(filters.state);
        paramIndex++;
      }

      if (filters.neighborhood) {
        conditions.push(`LOWER(neighborhood) LIKE LOWER($${paramIndex})`);
        params.push(`%${filters.neighborhood}%`);
        paramIndex++;
      }

      if (filters.zipCode) {
        conditions.push(`postal_code = $${paramIndex}`);
        params.push(filters.zipCode);
        paramIndex++;
      }

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

      // Price filters
      if (filters.minPrice) {
        conditions.push(`price_amount >= $${paramIndex}`);
        params.push(filters.minPrice);
        paramIndex++;
      }

      if (filters.maxPrice) {
        conditions.push(`price_amount <= $${paramIndex}`);
        params.push(filters.maxPrice);
        paramIndex++;
      }

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

      if (filters.minArea) {
        conditions.push(`area_sqm >= $${paramIndex}`);
        params.push(filters.minArea);
        paramIndex++;
      }

      if (filters.maxArea) {
        conditions.push(`area_sqm <= $${paramIndex}`);
        params.push(filters.maxArea);
        paramIndex++;
      }

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
        priceRange: 'SELECT MIN(price_amount) as min, MAX(price_amount) as max, AVG(price_amount) as avg FROM properties'
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
          min: parseFloat(priceRange.rows[0].min || 0),
          max: parseFloat(priceRange.rows[0].max || 0),
          avg: parseFloat(priceRange.rows[0].avg || 0)
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
      price: 'price_amount',
      date: 'listing_date',
      area: 'area_sqm',
      bedrooms: 'bedrooms'
    };

    return sortMap[sortBy || 'date'] || 'listing_date';
  }
}