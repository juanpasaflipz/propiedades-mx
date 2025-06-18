import axios, { AxiosInstance } from 'axios';
import { Pool } from 'pg';
import { withRetry, CircuitBreaker } from '../utils/retry';

export interface ScraperConfig {
  name: string;
  baseUrl: string;
  rateLimit: number; // requests per minute
  userAgent?: string;
  headers?: Record<string, string>;
}

export interface ScraperResult {
  success: boolean;
  totalScraped: number;
  errors: string[];
  startTime: Date;
  endTime: Date;
}

export abstract class BaseScraper {
  protected axios: AxiosInstance;
  protected circuitBreaker: CircuitBreaker;
  protected lastRequestTime = 0;
  protected scraperErrors: string[] = [];
  protected pool: Pool;

  constructor(protected config: ScraperConfig) {
    this.circuitBreaker = new CircuitBreaker();
    
    this.axios = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...config.headers
      }
    });

    // Add response interceptor for error handling
    this.axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          console.error(`HTTP ${error.response.status}: ${error.response.statusText}`);
        } else if (error.request) {
          console.error('No response received:', error.message);
        } else {
          console.error('Request error:', error.message);
        }
        throw error;
      }
    );

    // Initialize database connection
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }

  protected async rateLimit(): Promise<void> {
    const minInterval = 60000 / this.config.rateLimit; // Convert to ms between requests
    const elapsed = Date.now() - this.lastRequestTime;
    
    if (elapsed < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - elapsed));
    }
    
    this.lastRequestTime = Date.now();
  }

  protected async fetchWithRetry(url: string): Promise<string> {
    await this.rateLimit();
    
    return this.circuitBreaker.execute(async () => {
      return withRetry(async () => {
        const response = await this.axios.get(url);
        return response.data;
      }, {
        maxRetries: 3,
        shouldRetry: (error) => {
          // Custom retry logic for scraping
          if (error.response?.status === 403 || error.response?.status === 401) {
            console.error('Authentication/Authorization error - not retrying');
            return false;
          }
          return true;
        }
      });
    });
  }

  protected async saveProperties(properties: any[]): Promise<number> {
    if (properties.length === 0) return 0;

    const client = await this.pool.connect();
    let savedCount = 0;

    try {
      await client.query('BEGIN');

      for (const property of properties) {
        try {
          await client.query(
            `INSERT INTO properties (
              source, country, state_province, city, neighborhood,
              postal_code, address, coordinates_lat, coordinates_lng,
              transaction_type, price_amount, price_currency,
              property_type, bedrooms, bathrooms, area_sqm,
              lot_size_sqm, amenities, images, description,
              contact_info, listing_date, last_updated
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            ON CONFLICT (source, address, city) DO UPDATE SET
              price_amount = EXCLUDED.price_amount,
              last_updated = CURRENT_TIMESTAMP`,
            [
              this.config.name,
              property.country || 'Mexico',
              property.state_province || '',
              property.city || '',
              property.neighborhood || '',
              property.postal_code || '',
              property.address || '',
              property.coordinates?.lat || 0,
              property.coordinates?.lng || 0,
              property.transaction_type || 'sale',
              property.price?.amount || 0,
              property.price?.currency || 'MXN',
              property.property_type || 'house',
              property.bedrooms || 0,
              property.bathrooms || 0,
              property.area_sqm || 0,
              property.lot_size_sqm || null,
              property.amenities || [],
              property.images || [],
              property.description || '',
              property.contact_info || '',
              property.listing_date || new Date(),
              new Date()
            ]
          );
          savedCount++;
        } catch (error) {
          console.error(`Failed to save property: ${error.message}`);
          this.scraperErrors.push(`Failed to save property: ${error.message}`);
        }
      }

      await client.query('COMMIT');
      console.log(`Saved ${savedCount} properties to database`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction failed:', error);
      throw error;
    } finally {
      client.release();
    }

    return savedCount;
  }

  protected logError(error: string) {
    this.scraperErrors.push(error);
    console.error(`[${this.config.name}] ${error}`);
  }

  async scrape(): Promise<ScraperResult> {
    const startTime = new Date();
    let totalScraped = 0;

    try {
      console.log(`Starting ${this.config.name} scraper...`);
      totalScraped = await this.performScraping();
      
      return {
        success: true,
        totalScraped,
        errors: this.scraperErrors,
        startTime,
        endTime: new Date()
      };
    } catch (error) {
      this.logError(`Scraper failed: ${error.message}`);
      return {
        success: false,
        totalScraped,
        errors: this.scraperErrors,
        startTime,
        endTime: new Date()
      };
    } finally {
      await this.cleanup();
    }
  }

  protected abstract performScraping(): Promise<number>;

  protected async cleanup(): Promise<void> {
    // Override in subclasses if needed
    await this.pool.end();
  }
}