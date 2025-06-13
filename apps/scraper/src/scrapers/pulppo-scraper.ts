import * as cheerio from 'cheerio';
import { Property } from '@aggregator/types';

export class PulppoScraper {
  private propertyIdCounter: number = 1;

  async scrape(): Promise<void> {
    // TODO: Implement actual scraping logic
    console.log('Pulppo scraping not implemented yet');
  }

  /**
   * Parse Pulppo HTML and extract property data
   * Since Pulppo loads data dynamically, this parser handles both
   * server-rendered and client-rendered content
   */
  parseHTML(html: string): Property[] {
    const $ = cheerio.load(html);
    const properties: Property[] = [];

    // Try multiple selectors for Pulppo's property cards
    const selectors = [
      'a[href*="/propiedad/"]',
      '[class*="PropertyCard"]',
      '[class*="property-card"]',
      '[data-testid*="property"]',
      'article[class*="property"]',
      '.results-grid > div > a',
      '[class*="listing-card"]'
    ];

    let $listings: cheerio.Cheerio<cheerio.Element> | null = null;
    for (const selector of selectors) {
      const found = $(selector);
      if (found.length > 0) {
        console.log(`Found ${found.length} listings with selector: ${selector}`);
        $listings = found;
        break;
      }
    }

    if (!$listings || $listings.length === 0) {
      return properties;
    }

    $listings.each((_, element) => {
      try {
        const $el = $(element);
        
        // Get property URL
        const href = $el.attr('href') || $el.find('a').attr('href');
        if (!href || !href.includes('/propiedad/')) {
          return;
        }

        // Extract property ID from URL
        const idMatch = href.match(/\/propiedad\/([^\/]+)/);
        const externalId = idMatch ? idMatch[1] : `pulppo-${this.propertyIdCounter++}`;

        // Get all text content
        const fullText = $el.text().trim();
        
        // Extract price
        const priceMatch = fullText.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
        
        // Extract size
        const sizeMatch = fullText.match(/(\d+)\s*m²/);
        const size = sizeMatch ? parseFloat(sizeMatch[1]) : undefined;
        
        // Extract bedrooms
        const bedroomMatch = fullText.match(/(\d+)\s*rec[aá]maras?/i) || 
                            fullText.match(/(\d+)\s*habitaci[oó]n/i);
        const bedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : undefined;
        
        // Extract bathrooms
        const bathroomMatch = fullText.match(/(\d+)\s*ba[ñn]os?/i);
        const bathrooms = bathroomMatch ? parseInt(bathroomMatch[1]) : undefined;
        
        // Extract title - usually the first line or h2/h3
        const $title = $el.find('h2, h3, [class*="title"]').first();
        const title = $title.text().trim() || 
                     fullText.split('\n')[0].substring(0, 100) ||
                     'Propiedad en México';
        
        // Extract location - look for neighborhood/city patterns
        const locationPatterns = [
          /en\s+([A-Za-zÀ-ÿ\s]+),\s*([A-Za-zÀ-ÿ\s]+)/,  // "en Neighborhood, City"
          /([A-Za-zÀ-ÿ\s]+),\s*([A-Za-zÀ-ÿ\s]+)$/,      // "Neighborhood, City" at end
        ];
        
        let location = 'México';
        for (const pattern of locationPatterns) {
          const match = fullText.match(pattern);
          if (match) {
            location = match[0].replace(/^en\s+/, '');
            break;
          }
        }
        
        // Extract images
        const images: string[] = [];
        $el.find('img').each((_, img) => {
          const src = $(img).attr('src') || $(img).attr('data-src');
          if (src && !src.includes('placeholder') && !src.includes('logo')) {
            images.push(src);
          }
        });
        
        // Determine property type
        let propertyType = 'Propiedad';
        if (fullText.toLowerCase().includes('departamento') || fullText.toLowerCase().includes('depto')) {
          propertyType = 'Departamento';
        } else if (fullText.toLowerCase().includes('casa')) {
          propertyType = 'Casa';
        } else if (fullText.toLowerCase().includes('terreno')) {
          propertyType = 'Terreno';
        } else if (fullText.toLowerCase().includes('oficina')) {
          propertyType = 'Oficina';
        }
        
        properties.push({
          id: `PULPPO-${externalId}`,
          title,
          price,
          currency: 'MXN',  // Pulppo typically shows prices in MXN
          location,
          bedrooms: bedrooms || 0,  // Default to 0 if not found
          bathrooms,
          size,
          propertyType,
          link: href.startsWith('http') ? href : `https://pulppo.com${href}`,
          image: images[0] || 'https://via.placeholder.com/300x200',
          images: images.length > 0 ? images : ['https://via.placeholder.com/300x200'],
          source: 'pulppo',
          description: fullText.substring(0, 200),
          createdAt: new Date().toISOString()
        });
        
      } catch (err) {
        console.error('Error parsing Pulppo listing:', err);
      }
    });

    console.log(`Parsed ${properties.length} properties from Pulppo`);
    return properties;
  }

  /**
   * Build Pulppo search URL with filters
   */
  buildSearchUrl(params: {
    city?: string;
    priceMin?: string;
    priceMax?: string;
    bedrooms?: string;
    propertyType?: string;
  }): string {
    // Pulppo uses slug-based URLs for searches
    const baseUrl = 'https://pulppo.com';
    
    // Map cities to Pulppo slugs
    const cityMappings: { [key: string]: string } = {
      'mexico': 'propiedades-venta-ciudad-de-mexico',
      'cdmx': 'propiedades-venta-ciudad-de-mexico',
      'ciudad de mexico': 'propiedades-venta-ciudad-de-mexico',
      'guadalajara': 'propiedades-venta-guadalajara',
      'monterrey': 'propiedades-venta-monterrey',
      'puebla': 'propiedades-venta-puebla',
      'cancun': 'propiedades-venta-cancun',
      'playa del carmen': 'propiedades-venta-playa-del-carmen'
    };
    
    const city = params.city?.toLowerCase() || 'mexico';
    const slug = cityMappings[city] || 'propiedades-venta-mexico';
    
    // For now, return the slug URL
    // Pulppo's filtering happens client-side after initial load
    return `${baseUrl}/${slug}`;
  }
}