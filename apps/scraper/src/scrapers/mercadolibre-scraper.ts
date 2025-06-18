import * as cheerio from 'cheerio';
import { BaseScraper } from './base-scraper';
import { Property } from '../types';

export class MercadoLibreScraper extends BaseScraper {
  constructor() {
    super({
      name: 'MercadoLibre',
      baseUrl: 'https://inmuebles.mercadolibre.com.mx',
      rateLimit: 30, // 30 requests per minute
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
  }

  protected async performScraping(): Promise<number> {
    const cities = ['ciudad-de-mexico', 'guadalajara', 'monterrey', 'puebla', 'queretaro'];
    const propertyTypes = ['casas', 'departamentos'];
    let totalScraped = 0;

    for (const city of cities) {
      for (const propertyType of propertyTypes) {
        try {
          console.log(`Scraping ${propertyType} in ${city}...`);
          const properties = await this.scrapeCity(city, propertyType);
          const saved = await this.saveProperties(properties);
          totalScraped += saved;
          
          console.log(`Scraped ${properties.length} properties, saved ${saved}`);
        } catch (error) {
          this.logError(`Failed to scrape ${propertyType} in ${city}: ${error.message}`);
        }
      }
    }

    return totalScraped;
  }

  private async scrapeCity(city: string, propertyType: string): Promise<Property[]> {
    const properties: Property[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage && page <= 5) { // Limit to 5 pages per city/type
      try {
        const url = `/${propertyType}/${city}/_Desde_${(page - 1) * 48 + 1}`;
        console.log(`Fetching page ${page}: ${url}`);
        
        const html = await this.fetchWithRetry(url);
        const pageProperties = this.parseHTML(html);
        
        if (pageProperties.length === 0) {
          hasNextPage = false;
        } else {
          properties.push(...pageProperties);
          page++;
        }
      } catch (error) {
        this.logError(`Failed to fetch page ${page}: ${error.message}`);
        hasNextPage = false;
      }
    }

    return properties;
  }

  /**
   * Parse MercadoLibre HTML and extract property data
   */
  private parseHTML(html: string): Property[] {
    const $ = cheerio.load(html);
    const properties: Property[] = [];

    // MercadoLibre structure: parse complete list items
    $('li.ui-search-layout__item').each((_, element) => {
      try {
        const property = this.parseProperty($, element);
        if (property) {
          properties.push(property);
        }
      } catch (error) {
        this.logError(`Failed to parse property: ${error.message}`);
      }
    });

    return properties;
  }

  private parseProperty($: cheerio.CheerioAPI, element: cheerio.Element): Property | null {
    const $el = $(element);
    
    // Extract basic information
    const titleElement = $el.find('.poly-component__title');
    const title = titleElement.text().trim();
    if (!title) return null;
    
    // Get the link
    const href = titleElement.attr('href') || $el.find('a[href*="MLM-"]').first().attr('href') || '';
    
    // Extract ID from URL
    const idMatch = href.match(/MLM-(\d+)/);
    const externalId = idMatch ? idMatch[1] : null;
    if (!externalId) return null;
    
    // Extract price
    const priceText = $el.find('.andes-money-amount__fraction').first().text().trim();
    const priceMatch = priceText.match(/[\d,]+/);
    const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
    
    // Extract location
    const location = $el.find('.poly-component__location').text().trim() || 'México';
    const [city, state] = location.split(',').map(s => s.trim());
    
    // Extract attributes
    const attributes = this.parseAttributes($, $el);
    
    // Extract images
    const imageUrl = $el.find('img[data-src]').attr('data-src') || 
                    $el.find('img[src*="http"]').first().attr('src') || '';
    
    // Determine property type
    const propertyType = this.determinePropertyType(title, href);
    
    return {
      id: externalId,
      source: 'mercadolibre',
      country: 'Mexico',
      state_province: state || '',
      city: city || location,
      neighborhood: '',
      postal_code: '',
      address: title,
      coordinates: { lat: 0, lng: 0 },
      transaction_type: href.includes('venta') ? 'sale' : 'rent',
      price: {
        amount: price,
        currency: 'MXN'
      },
      property_type: propertyType,
      bedrooms: attributes.bedrooms,
      bathrooms: attributes.bathrooms,
      area_sqm: attributes.area,
      lot_size_sqm: null,
      amenities: [],
      images: imageUrl ? [imageUrl] : [],
      description: '',
      contact_info: href,
      listing_date: new Date(),
      last_updated: new Date()
    };
  }

  private parseAttributes($: cheerio.CheerioAPI, $el: cheerio.Cheerio<cheerio.Element>) {
    const attributes = {
      bedrooms: 0,
      bathrooms: 0,
      area: 0
    };

    $el.find('.poly-attributes_list__item').each((_, attr) => {
      const text = $(attr).text().trim().toLowerCase();
      
      // Parse bedrooms
      if (text.includes('recámara') || text.includes('dormitorio')) {
        const match = text.match(/(\d+)/);
        if (match) attributes.bedrooms = parseInt(match[1]);
      }
      
      // Parse bathrooms
      if (text.includes('baño')) {
        const match = text.match(/(\d+)/);
        if (match) attributes.bathrooms = parseInt(match[1]);
      }
      
      // Parse area
      if (text.includes('m²')) {
        const match = text.match(/(\d+)/);
        if (match) attributes.area = parseInt(match[1]);
      }
    });

    return attributes;
  }

  private determinePropertyType(title: string, url: string): string {
    const lowerTitle = title.toLowerCase();
    const lowerUrl = url.toLowerCase();
    
    if (lowerTitle.includes('casa') || lowerUrl.includes('casa')) return 'house';
    if (lowerTitle.includes('departamento') || lowerUrl.includes('departamento')) return 'apartment';
    if (lowerTitle.includes('terreno') || lowerUrl.includes('terreno')) return 'land';
    if (lowerTitle.includes('local') || lowerUrl.includes('local')) return 'commercial';
    if (lowerTitle.includes('oficina') || lowerUrl.includes('oficina')) return 'commercial';
    
    return 'house'; // default
  }
}