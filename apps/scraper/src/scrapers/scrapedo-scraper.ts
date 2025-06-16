import axios from 'axios';
import * as cheerio from 'cheerio';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

interface Property {
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
  private token: string;
  private apiUrl: string = 'http://api.scrape.do';

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

    this.token = process.env.SCRAPEDO_TOKEN || process.env.SCRAPEDO_API_KEY || '';
    
    if (!this.token) {
      console.warn('SCRAPEDO_TOKEN not configured');
    }
  }

  async scrape(): Promise<void> {
    console.log('Starting Scrape.do scraper...');
    
    if (!this.token) {
      console.error('Scrape.do token not configured. Set SCRAPEDO_TOKEN environment variable.');
      return;
    }

    try {
      // Scrape multiple cities from MercadoLibre
      const cities = [
        { name: 'mexico-city', url: 'distrito-federal' },
        { name: 'guadalajara', url: 'jalisco/guadalajara' },
        { name: 'monterrey', url: 'nuevo-leon/monterrey' },
        { name: 'puebla', url: 'puebla/puebla' },
        { name: 'cancun', url: 'quintana-roo/benito-juarez' }
      ];

      let allProperties: Property[] = [];

      for (const city of cities) {
        console.log(`Scraping properties in ${city.name}...`);
        const properties = await this.scrapeMercadoLibre(city.url);
        allProperties = allProperties.concat(properties);
        
        // Add delay between requests to be respectful
        await this.delay(2000);
      }

      if (allProperties.length === 0) {
        console.log('No properties scraped');
        return;
      }

      console.log(`Total properties scraped: ${allProperties.length}`);
      
      // Save properties to database
      await this.savePropertiesToDatabase(allProperties);
      
      console.log('Scrape.do scraper completed successfully');
    } catch (error) {
      console.error('Scrape.do scraper failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  private async scrapeMercadoLibre(cityPath: string): Promise<Property[]> {
    try {
      const targetUrl = `https://inmuebles.mercadolibre.com.mx/venta/${cityPath}/`;
      const encodedUrl = encodeURIComponent(targetUrl);
      const scrapeDoUrl = `${this.apiUrl}/?token=${this.token}&url=${encodedUrl}&render=true`;
      
      console.log(`Scraping URL: ${targetUrl}`);
      
      const response = await axios.get(scrapeDoUrl, {
        timeout: 60000 // 60 second timeout
      });

      if (response.status !== 200) {
        console.error(`Failed to scrape ${targetUrl}: ${response.status}`);
        return [];
      }

      // Parse the HTML
      return this.parseMercadoLibreHTML(response.data);
    } catch (error: any) {
      console.error(`Error scraping MercadoLibre for ${cityPath}:`, error.message);
      return [];
    }
  }

  private parseMercadoLibreHTML(html: string): Property[] {
    const $ = cheerio.load(html);
    const properties: Property[] = [];
    let propertyCount = 0;

    // MercadoLibre uses different selectors, let's try multiple
    const selectors = [
      'li.ui-search-layout__item',
      'li[class*="results-item"]',
      'div.ui-search-result__wrapper',
      'article.ui-search-result'
    ];

    let itemsFound = false;
    for (const selector of selectors) {
      const items = $(selector);
      if (items.length > 0) {
        console.log(`Found ${items.length} items using selector: ${selector}`);
        itemsFound = true;
        
        items.each((_, element) => {
          try {
            const property = this.extractPropertyFromElement($, element);
            if (property) {
              properties.push(property);
              propertyCount++;
            }
          } catch (err) {
            console.error('Error parsing property:', err);
          }
        });
        break;
      }
    }

    if (!itemsFound) {
      console.log('No property items found. Page might have different structure.');
    }

    console.log(`Parsed ${properties.length} properties`);
    return properties;
  }

  private extractPropertyFromElement($: cheerio.CheerioAPI, element: cheerio.Element): Property | null {
    const $el = $(element);
    
    // Extract title
    const title = $el.find('.ui-search-item__title, .ui-search-result__content-title, h2').first().text().trim();
    if (!title) return null;

    // Extract link
    const linkElement = $el.find('a[href*="/MLM-"]').first();
    const href = linkElement.attr('href') || '';
    
    // Extract ID from URL
    const idMatch = href.match(/MLM-(\d+)/);
    const externalId = idMatch ? `MLM-${idMatch[1]}` : `ml-${Date.now()}`;
    
    // Extract price
    const priceText = $el.find('.price-tag-text-sr-only, .andes-money-amount__fraction, .price__fraction').first().text().trim();
    const priceMatch = priceText.match(/[\d,]+/);
    const price = priceMatch ? priceMatch[0].replace(/,/g, '') : '0';
    
    // Extract location
    const location = $el.find('.ui-search-item__location, .ui-search-result__content-location').text().trim() || 'Mexico';
    
    // Extract city and state from location
    const locationParts = location.split(',').map(p => p.trim());
    const city = locationParts[0] || 'Unknown';
    const state = locationParts[1] || 'Mexico';
    
    // Extract attributes
    const attributes = $el.find('.ui-search-item__attributes li, .ui-search-result__content-attributes li').map((_, attr) => 
      $(attr).text().trim()
    ).get();
    
    let size = '0';
    let bedrooms = 0;
    let bathrooms = 0;
    
    attributes.forEach(attr => {
      // Size in m²
      const sizeMatch = attr.match(/(\d+)\s*m²/);
      if (sizeMatch) {
        size = sizeMatch[1];
      }
      
      // Bedrooms
      if (attr.toLowerCase().includes('recámara') || attr.toLowerCase().includes('dormitorio')) {
        const numMatch = attr.match(/(\d+)/);
        if (numMatch) {
          bedrooms = parseInt(numMatch[1]);
        }
      }
      
      // Bathrooms
      if (attr.toLowerCase().includes('baño')) {
        const numMatch = attr.match(/(\d+)/);
        if (numMatch) {
          bathrooms = parseInt(numMatch[1]);
        }
      }
    });
    
    // Determine property type
    let propertyType = 'Casa';
    const titleLower = title.toLowerCase();
    if (titleLower.includes('departamento') || titleLower.includes('depto')) {
      propertyType = 'Departamento';
    } else if (titleLower.includes('terreno')) {
      propertyType = 'Terreno';
    } else if (titleLower.includes('oficina')) {
      propertyType = 'Oficina';
    } else if (titleLower.includes('local')) {
      propertyType = 'Local';
    }
    
    return {
      external_id: externalId,
      title,
      price,
      currency: 'MXN',
      location,
      city,
      state,
      bedrooms,
      bathrooms,
      size,
      property_type: propertyType,
      link: href,
      description: attributes.join(' • ') || title,
      source: 'mercadolibre'
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async savePropertiesToDatabase(properties: Property[]): Promise<void> {
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
      // Test with a simple httpbin request
      const testUrl = encodeURIComponent('https://httpbin.org/get');
      const scrapeDoUrl = `${this.apiUrl}/?token=${this.token}&url=${testUrl}`;
      
      console.log('Testing Scrape.do connection...');
      const response = await axios.get(scrapeDoUrl, {
        timeout: 30000
      });
      
      if (response.status === 200) {
        console.log('Scrape.do connection successful');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Scrape.do connection failed:', error.message);
      if (error.response?.status === 401) {
        console.error('Authentication failed. Check your SCRAPEDO_TOKEN.');
      }
      return false;
    }
  }
}