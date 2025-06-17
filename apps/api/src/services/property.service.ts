import { Pool } from 'pg';
import { Property } from '../models/property.model';

export class PropertyService {
  private pool: Pool | null = null;

  private mapDbRowToProperty(row: any): Property {
    return {
      id: row.id.toString(),
      source: row.source,
      country: 'Mexico', // Default since not in DB
      state_province: row.state || '',
      city: row.city || '',
      neighborhood: '', // Not in DB
      postal_code: '', // Not in DB
      address: row.location || '',
      coordinates: {
        lat: 0, // Not in DB
        lng: 0  // Not in DB
      },
      transaction_type: 'sale', // Default since not in DB
      price: {
        amount: row.price ? parseFloat(row.price) : 0,
        currency: row.currency || 'MXN'
      },
      property_type: row.property_type || 'house',
      bedrooms: row.bedrooms || 0,
      bathrooms: row.bathrooms || 0,
      area_sqm: row.size ? parseFloat(row.size) : 0,
      lot_size_sqm: null,
      amenities: [],
      images: [], // Could parse from link
      description: row.description || row.title || '',
      contact_info: row.link || '',
      listing_date: row.created_at,
      last_updated: row.updated_at
    };
  }

  constructor() {
    // Always connect to database
    console.log('Connecting to database...');
    if (process.env.DATABASE_URL) {
      console.log('Using DATABASE_URL connection string');
      
      // Parse the connection URL to extract components
      const connectionUrl = new URL(process.env.DATABASE_URL);
      
      // Use parsed connection details to avoid IPv6 issues
      this.pool = new Pool({
        user: decodeURIComponent(connectionUrl.username),
        password: decodeURIComponent(connectionUrl.password),
        host: connectionUrl.hostname,
        port: parseInt(connectionUrl.port),
        database: connectionUrl.pathname.slice(1), // Remove leading slash
        ssl: { rejectUnauthorized: false }
      });
      
      // Test the connection
      this.pool.connect()
        .then(client => {
          console.log('Database connected successfully');
          client.release();
        })
        .catch(err => {
          console.error('Database connection error:', err.message);
        });
    } else {
      // Use individual variables (local dev)
      this.pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432'),
      });
    }
  }

  async searchProperties(filters: any): Promise<Property[]> {
    try {
      // Always use real database data

      console.log('Executing database query with filters:', filters);
      
      // First, let's check if the table exists and has data
      const tableCheckQuery = 'SELECT COUNT(*) FROM properties';
      try {
        const countResult = await this.pool!.query(tableCheckQuery);
        console.log('Total properties in database:', countResult.rows[0].count);
      } catch (tableError) {
        console.error('Error checking table:', tableError);
      }
      
      // If no filters are provided, return all properties
      const hasFilters = filters.country || filters.city || filters.transactionType || 
                       filters.minPrice || filters.maxPrice || filters.propertyType || 
                       filters.minBedrooms || filters.minBathrooms || filters.area || filters.zipCode;
      
      if (!hasFilters) {
        console.log('No filters provided, returning all properties');
        const simpleQuery = 'SELECT * FROM properties ORDER BY created_at DESC LIMIT 50';
        const result = await this.pool!.query(simpleQuery);
        console.log(`Database query returned ${result.rows.length} properties`);
        return result.rows.map(row => this.mapDbRowToProperty(row));
      }
      
      const query = `
      SELECT * FROM properties
      WHERE ($1::text IS NULL OR state = $1)
      AND ($2::text IS NULL OR city ILIKE '%' || $2 || '%')
      AND ($3::text IS NULL OR true) -- transaction_type not in DB
      AND ($4::numeric IS NULL OR CAST(price AS NUMERIC) >= $4)
      AND ($5::numeric IS NULL OR CAST(price AS NUMERIC) <= $5)
      AND ($6::text IS NULL OR property_type ILIKE '%' || $6 || '%')
      AND ($7::int IS NULL OR bedrooms >= $7)
      AND ($8::int IS NULL OR bathrooms >= $8)
      AND ($9::text IS NULL OR location ILIKE '%' || $9 || '%')
      AND ($10::text IS NULL OR true) -- postal_code not in DB
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const values = [
      filters.state || filters.country, // Use state or country for state filter
      filters.city,
      filters.transactionType,
      filters.minPrice ? parseFloat(filters.minPrice) : null,
      filters.maxPrice ? parseFloat(filters.maxPrice) : null,
      filters.propertyType,
      filters.minBedrooms ? parseInt(filters.minBedrooms) : null,
      filters.minBathrooms ? parseInt(filters.minBathrooms) : null,
      filters.area,
      filters.zipCode,
    ];

      const result = await this.pool!.query(query, values);
      console.log(`Database query returned ${result.rows.length} properties`);
      return result.rows.map(row => this.mapDbRowToProperty(row));
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async getPropertyById(id: string): Promise<Property | null> {
    // Always use real database data

    const query = 'SELECT * FROM properties WHERE id = $1';
    const result = await this.pool!.query(query, [id]);
    return result.rows[0] ? this.mapDbRowToProperty(result.rows[0]) : null;
  }

  async getPropertiesByCountry(country: string): Promise<Property[]> {
    // Always use real database data

    // Since country is not in DB, return all properties for Mexico
    const query = 'SELECT * FROM properties LIMIT 50';
    const result = await this.pool!.query(query);
    return result.rows.map(row => this.mapDbRowToProperty(row));
  }

  async getPropertiesByCity(city: string): Promise<Property[]> {
    // Always use real database data

    const query = 'SELECT * FROM properties WHERE city ILIKE $1 LIMIT 50';
    const result = await this.pool!.query(query, [`%${city}%`]);
    return result.rows.map(row => this.mapDbRowToProperty(row));
  }
} 