import axios from 'axios';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

interface ScrapeDoProperty {
  id: number;
  external_id: string;
  title: string;
  price: string;
  currency: string;
  location: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  size: string;
  property_type: string;
  link: string;
  description: string;
  source: string;
}

export class ScrapeDoScraper {
  private pool: Pool;
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    // Initialize database connection
    if (process.env.DATABASE_URL) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
    } else {
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || '',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'real_estate_db',
        ssl: process.env.NODE_ENV === 'production'
      });
    }

    this.apiKey = process.env.SCRAPEDO_API_KEY || '';
    this.apiUrl = process.env.SCRAPEDO_API_URL || 'https://api.scrape.do';
    
    if (!this.apiKey) {
      console.warn('SCRAPEDO_API_KEY not configured');
    }
  }

  async scrape(): Promise<void> {
    console.log('Starting Scrape.do scraper...');
    
    if (!this.apiKey) {
      console.error('Scrape.do API key not configured. Set SCRAPEDO_API_KEY environment variable.');
      return;
    }

    try {
      // Fetch properties from Scrape.do API
      const properties = await this.fetchPropertiesFromScrapeDo();
      
      if (properties.length === 0) {
        console.log('No properties fetched from Scrape.do');
        return;
      }

      console.log(`Fetched ${properties.length} properties from Scrape.do`);
      
      // Save properties to database
      await this.savePropertiesToDatabase(properties);
      
      console.log('Scrape.do scraper completed successfully');
    } catch (error) {
      console.error('Scrape.do scraper failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  private async fetchPropertiesFromScrapeDo(): Promise<ScrapeDoProperty[]> {
    try {
      console.log('Fetching properties from Scrape.do API...');
      
      // Make request to Scrape.do API
      const response = await axios.get(`${this.apiUrl}/properties`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json'
        },
        params: {
          country: 'Mexico',
          limit: 1000 // Adjust based on your needs
        }
      });

      if (response.data && Array.isArray(response.data.properties)) {
        return response.data.properties;
      }

      console.warn('Unexpected response format from Scrape.do:', response.data);
      return [];
    } catch (error: any) {
      if (error.response) {
        console.error('Scrape.do API error:', error.response.status, error.response.data);
      } else {
        console.error('Error fetching from Scrape.do:', error.message);
      }
      throw error;
    }
  }

  private async savePropertiesToDatabase(properties: ScrapeDoProperty[]): Promise<void> {
    console.log(`Saving ${properties.length} properties to database...`);
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const property of properties) {
        // Check if property already exists
        const existingProperty = await client.query(
          'SELECT id FROM properties WHERE external_id = $1 AND source = $2',
          [property.external_id, property.source || 'scrapedo']
        );

        if (existingProperty.rows.length > 0) {
          // Update existing property
          await client.query(`
            UPDATE properties 
            SET 
              title = $1,
              price = $2,
              currency = $3,
              location = $4,
              city = $5,
              state = $6,
              bedrooms = $7,
              bathrooms = $8,
              size = $9,
              property_type = $10,
              link = $11,
              description = $12,
              updated_at = CURRENT_TIMESTAMP,
              last_seen_at = CURRENT_TIMESTAMP
            WHERE external_id = $13 AND source = $14
          `, [
            property.title,
            property.price,
            property.currency || 'MXN',
            property.location,
            property.city,
            property.state,
            property.bedrooms || 0,
            property.bathrooms || 0,
            property.size,
            property.property_type,
            property.link,
            property.description,
            property.external_id,
            property.source || 'scrapedo'
          ]);
        } else {
          // Insert new property
          await client.query(`
            INSERT INTO properties (
              external_id,
              title,
              price,
              currency,
              location,
              city,
              state,
              bedrooms,
              bathrooms,
              size,
              property_type,
              link,
              description,
              source,
              created_at,
              updated_at,
              last_seen_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            property.external_id,
            property.title,
            property.price,
            property.currency || 'MXN',
            property.location,
            property.city,
            property.state,
            property.bedrooms || 0,
            property.bathrooms || 0,
            property.size,
            property.property_type,
            property.link,
            property.description,
            property.source || 'scrapedo'
          ]);
        }
      }

      await client.query('COMMIT');
      console.log('Properties saved successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving properties to database:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.apiUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      console.log('Scrape.do API connection successful:', response.data);
      return true;
    } catch (error: any) {
      console.error('Scrape.do API connection failed:', error.response?.data || error.message);
      return false;
    }
  }
}