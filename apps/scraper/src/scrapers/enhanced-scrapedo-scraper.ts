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

export class EnhancedScrapeDoScraper {
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
      throw new Error('SCRAPEDO_TOKEN or SCRAPEDO_API_KEY is required');
    }
  }

  async scrape(): Promise<void> {
    try {
      console.log('Starting enhanced Scrape.do scraper...');
      
      // Extended list of Mexican cities
      const cities = [
        // Major cities
        { name: 'cdmx', url: 'distrito-federal' },
        { name: 'guadalajara', url: 'jalisco/guadalajara' },
        { name: 'monterrey', url: 'nuevo-leon/monterrey' },
        { name: 'puebla', url: 'puebla/puebla' },
        { name: 'cancun', url: 'quintana-roo/benito-juarez' },
        { name: 'merida', url: 'yucatan/merida' },
        { name: 'queretaro', url: 'queretaro/queretaro' },
        { name: 'san-luis-potosi', url: 'san-luis-potosi/san-luis-potosi' },
        { name: 'aguascalientes', url: 'aguascalientes/aguascalientes' },
        { name: 'tijuana', url: 'baja-california/tijuana' },
        { name: 'leon', url: 'guanajuato/leon' },
        { name: 'toluca', url: 'estado-de-mexico/toluca' },
        { name: 'playa-del-carmen', url: 'quintana-roo/solidaridad' },
        { name: 'tulum', url: 'quintana-roo/tulum' },
        { name: 'puerto-vallarta', url: 'jalisco/puerto-vallarta' },
        { name: 'cuernavaca', url: 'morelos/cuernavaca' },
        { name: 'oaxaca', url: 'oaxaca/oaxaca-de-juarez' },
        { name: 'chihuahua', url: 'chihuahua/chihuahua' },
        { name: 'veracruz', url: 'veracruz/veracruz' },
        { name: 'morelia', url: 'michoacan/morelia' }
      ];

      let allProperties: Property[] = [];
      const maxPagesPerCity = 5; // Scrape up to 5 pages per city

      for (const city of cities) {
        console.log(`\\nScraping properties in ${city.name}...`);
        
        for (let page = 1; page <= maxPagesPerCity; page++) {
          try {
            const properties = await this.scrapeMercadoLibrePage(city.url, page);
            
            if (properties.length === 0) {
              console.log(`No more properties found for ${city.name} at page ${page}`);
              break; // No more pages
            }
            
            allProperties = allProperties.concat(properties);
            console.log(`Page ${page}: Found ${properties.length} properties (Total: ${allProperties.length})`);
            
            // Add delay between requests
            await this.delay(3000);
          } catch (error) {
            console.error(`Error scraping ${city.name} page ${page}:`, error);
            break; // Skip to next city on error
          }
        }
      }

      if (allProperties.length === 0) {
        console.log('No properties scraped');
        return;
      }

      console.log(`\\nTotal properties scraped: ${allProperties.length}`);
      
      // Save properties to database
      await this.savePropertiesToDatabase(allProperties);
      
      console.log('Enhanced Scrape.do scraper completed successfully');
    } catch (error) {
      console.error('Enhanced Scrape.do scraper failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  private async scrapeMercadoLibrePage(cityPath: string, page: number): Promise<Property[]> {
    try {
      // Calculate offset for pagination (48 items per page on MercadoLibre)
      const offset = (page - 1) * 48 + 1;
      const targetUrl = page === 1 
        ? `https://inmuebles.mercadolibre.com.mx/venta/${cityPath}/`
        : `https://inmuebles.mercadolibre.com.mx/venta/${cityPath}/_Desde_${offset}`;
      
      const encodedUrl = encodeURIComponent(targetUrl);
      const scrapeDoUrl = `${this.apiUrl}/?token=${this.token}&url=${encodedUrl}&render=true`;
      
      console.log(`Scraping URL: ${targetUrl}`);
      
      const response = await axios.get(scrapeDoUrl, {
        timeout: 90000, // 90 second timeout
        maxContentLength: 50 * 1024 * 1024 // 50MB
      });

      if (response.status !== 200) {
        console.error(`Failed to scrape ${targetUrl}: ${response.status}`);
        return [];
      }

      // Parse the HTML
      return this.parseMercadoLibreHTML(response.data);
    } catch (error: any) {
      console.error(`Error scraping MercadoLibre ${cityPath} page ${page}:`, error.message);
      return [];
    }
  }

  private parseMercadoLibreHTML(html: string): Property[] {
    const $ = cheerio.load(html);
    const properties: Property[] = [];

    // Multiple selectors for different page layouts
    const selectors = [
      'li.ui-search-layout__item',
      'li[class*="results-item"]',
      'div.ui-search-result__wrapper',
      'article.ui-search-result',
      'div.ui-search-result__content'
    ];

    let itemsFound = false;
    for (const selector of selectors) {
      const items = $(selector);
      if (items.length > 0) {
        itemsFound = true;
        items.each((_, element) => {
          try {
            const property = this.extractPropertyFromElement($, element);
            if (property) {
              properties.push(property);
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
    const externalId = idMatch ? `MLM-${idMatch[1]}` : `ml-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
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
    
    // Parse attributes
    attributes.forEach(attr => {
      if (attr.includes('m²')) {
        size = attr.match(/\d+/)?.[0] || '0';
      } else if (attr.includes('recámara') || attr.includes('dormitorio')) {
        bedrooms = parseInt(attr.match(/\d+/)?.[0] || '0');
      } else if (attr.includes('baño')) {
        bathrooms = parseInt(attr.match(/\d+/)?.[0] || '0');
      }
    });

    // Extract description
    const description = $el.find('.ui-search-result__content-summary').text().trim() || title;

    // Determine property type from title
    let propertyType = 'Other';
    const titleLower = title.toLowerCase();
    if (titleLower.includes('casa')) propertyType = 'Casa';
    else if (titleLower.includes('departamento') || titleLower.includes('depto')) propertyType = 'Departamento';
    else if (titleLower.includes('terreno')) propertyType = 'Terreno';
    else if (titleLower.includes('local')) propertyType = 'Local';
    else if (titleLower.includes('oficina')) propertyType = 'Oficina';
    else if (titleLower.includes('bodega')) propertyType = 'Bodega';

    const property: Property = {
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
      link: href.startsWith('http') ? href : `https://www.mercadolibre.com.mx${href}`,
      description,
      source: 'mercadolibre'
    };

    return property;
  }

  private async savePropertiesToDatabase(properties: Property[]): Promise<void> {
    console.log(`Saving ${properties.length} properties to database...`);
    
    let savedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const property of properties) {
      try {
        const existingCheck = await this.pool.query(
          'SELECT id FROM properties WHERE external_id = $1',
          [property.external_id]
        );

        const propertyId = existingCheck.rows.length > 0 ? existingCheck.rows[0].id : null;

        const query = propertyId ? 
          // Update existing property
          `UPDATE properties SET
            title = $2,
            price = $3,
            currency = $4,
            location = $5,
            city = $6,
            state_province = $7,
            bedrooms = $8,
            bathrooms = $9,
            area_sqm = $10,
            property_type = $11,
            link = $12,
            description = $13,
            source = $14,
            last_seen_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING id` :
          // Insert new property
          `INSERT INTO properties (
            external_id, title, price, currency, location, city, state_province,
            bedrooms, bathrooms, area_sqm, property_type, link, description, source,
            country, address, coordinates_lat, coordinates_lng, 
            transaction_type, price_amount, price_currency,
            lot_size_sqm, amenities, images, contact_info,
            listing_date, last_updated
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
            'Mexico', $5, 0, 0, 'sale', $3::numeric, $4,
            0, '{}', '{}', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          ON CONFLICT (external_id) DO UPDATE SET
            title = EXCLUDED.title,
            price = EXCLUDED.price,
            price_amount = EXCLUDED.price_amount,
            last_updated = CURRENT_TIMESTAMP
          RETURNING id`;

        const values = propertyId ?
          [propertyId, property.title, property.price, property.currency, property.location, 
           property.city, property.state, property.bedrooms, property.bathrooms, 
           parseInt(property.size) || 0, property.property_type, property.link, 
           property.description, property.source] :
          [property.external_id, property.title, property.price, property.currency, property.location,
           property.city, property.state, property.bedrooms, property.bathrooms,
           parseInt(property.size) || 0, property.property_type, property.link,
           property.description, property.source];

        await this.pool.query(query, values);
        
        if (propertyId) {
          updatedCount++;
        } else {
          savedCount++;
        }
      } catch (error) {
        console.error(`Error saving property ${property.external_id}:`, error);
        errorCount++;
      }
    }

    console.log(`Database update complete:`);
    console.log(`  - New properties: ${savedCount}`);
    console.log(`  - Updated properties: ${updatedCount}`);
    console.log(`  - Errors: ${errorCount}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Scrape.do connection...');
      const testUrl = 'https://www.example.com';
      const encodedUrl = encodeURIComponent(testUrl);
      const scrapeDoUrl = `${this.apiUrl}/?token=${this.token}&url=${encodedUrl}`;
      
      const response = await axios.get(scrapeDoUrl, { timeout: 30000 });
      
      if (response.status === 200) {
        console.log('✅ Scrape.do connection successful');
        return true;
      } else {
        console.log('❌ Scrape.do connection failed with status:', response.status);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Scrape.do connection error:', error.message);
      return false;
    }
  }
}

// Allow running directly
if (require.main === module) {
  const scraper = new EnhancedScrapeDoScraper();
  
  if (process.argv[2] === 'test') {
    scraper.testConnection()
      .then(success => process.exit(success ? 0 : 1))
      .catch(() => process.exit(1));
  } else {
    scraper.scrape()
      .then(() => {
        console.log('Scraping completed');
        process.exit(0);
      })
      .catch(error => {
        console.error('Scraping failed:', error);
        process.exit(1);
      });
  }
}