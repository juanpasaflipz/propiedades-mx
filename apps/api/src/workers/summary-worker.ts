import { Pool } from 'pg';
import { getOpenAIService } from '../services/openai.service';
import { Logger } from '../utils/logger';
import { Property } from '../models/property.model';

interface NeighborhoodStats {
  neighborhood: string;
  city: string;
  totalListings: number;
  avgPriceRent: number;
  avgPriceSale: number;
  avgBedrooms: number;
  avgBathrooms: number;
  propertyTypes: Record<string, number>;
  priceRange: { min: number; max: number };
}

export class SummaryWorker {
  private isRunning = false;
  private updateInterval = 24 * 60 * 60 * 1000; // 24 hours
  private lastRunTime: Date | null = null;

  constructor(
    private pool: Pool,
    private logger: Logger
  ) {}

  async start() {
    if (this.isRunning) {
      this.logger.warn('Summary worker already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting summary worker');

    // Run immediately on start
    await this.generateAllSummaries();

    // Then run periodically
    while (this.isRunning) {
      try {
        await this.sleep(this.updateInterval);
        await this.generateAllSummaries();
      } catch (error) {
        this.logger.error('Error in summary worker cycle', error);
        await this.sleep(60000); // Retry after 1 minute on error
      }
    }
  }

  stop() {
    this.isRunning = false;
    this.logger.info('Stopping summary worker');
  }

  /**
   * Generate summaries for all neighborhoods
   */
  private async generateAllSummaries() {
    const startTime = Date.now();
    this.logger.info('Starting neighborhood summary generation');

    try {
      // Get all unique neighborhood/city combinations
      const neighborhoods = await this.getUniqueNeighborhoods();
      
      this.logger.info(`Found ${neighborhoods.length} unique neighborhoods to summarize`);

      // Process each neighborhood
      let successCount = 0;
      for (const { city } of neighborhoods) {
        try {
          await this.generateCitySummary(city);
          successCount++;
        } catch (error) {
          this.logger.error(`Failed to generate summary for ${city}`, error);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.info(`Generated ${successCount} neighborhood summaries in ${duration}ms`);
      
      this.lastRunTime = new Date();

    } catch (error) {
      this.logger.error('Failed to generate neighborhood summaries', error);
    }
  }

  /**
   * Get unique neighborhoods from the database
   */
  private async getUniqueNeighborhoods(): Promise<Array<{ city: string }>> {
    const query = `
      SELECT DISTINCT city
      FROM properties
      WHERE city IS NOT NULL AND city != ''
      ORDER BY city
    `;
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Generate summary for a specific city (neighborhoods not available in current schema)
   */
  private async generateCitySummary(city: string) {
    this.logger.info(`Generating summary for ${city}`);

    try {
      // Get statistics for the city
      const stats = await this.getCityStatistics(city);
      
      if (stats.totalListings === 0) {
        this.logger.info(`No listings found for ${city}, skipping`);
        return;
      }

      // Determine price bands
      const priceBands = this.calculatePriceBands(stats);

      // Generate summaries for each price band
      for (const band of ['low', 'medium', 'high'] as const) {
        const summary = await this.generateSummaryText(stats, band, priceBands[band]);
        
        await this.storeSummary({
          neighborhood: city, // Using city as neighborhood since it's not in the schema
          city,
          summary,
          avgPriceRent: band === 'low' ? priceBands.low.avg : band === 'medium' ? priceBands.medium.avg : priceBands.high.avg,
          avgPriceSale: band === 'low' ? priceBands.low.avg : band === 'medium' ? priceBands.medium.avg : priceBands.high.avg,
          totalListings: priceBands[band].count,
          priceBand: band
        });
      }

    } catch (error) {
      this.logger.error(`Failed to generate summary for ${city}`, error);
      throw error;
    }
  }

  /**
   * Get statistics for a city
   */
  private async getCityStatistics(city: string): Promise<NeighborhoodStats> {
    const queries = {
      // Basic stats
      stats: `
        SELECT 
          COUNT(*) as total,
          AVG(CASE WHEN bedrooms > 0 THEN bedrooms END) as avg_bedrooms,
          AVG(CASE WHEN bathrooms > 0 THEN bathrooms END) as avg_bathrooms
        FROM properties
        WHERE LOWER(city) = LOWER($1)
      `,
      
      // Property type distribution
      propertyTypes: `
        SELECT property_type, COUNT(*) as count
        FROM properties
        WHERE LOWER(city) = LOWER($1) AND property_type IS NOT NULL
        GROUP BY property_type
      `,
      
      // Price stats
      prices: `
        SELECT 
          price_amount,
          price_currency,
          transaction_type
        FROM properties
        WHERE LOWER(city) = LOWER($1) AND price_amount IS NOT NULL
      `
    };

    const [statsResult, typesResult, pricesResult] = await Promise.all([
      this.pool.query(queries.stats, [city]),
      this.pool.query(queries.propertyTypes, [city]),
      this.pool.query(queries.prices, [city])
    ]);

    // Parse prices
    const prices = pricesResult.rows.map(row => {
      return {
        amount: parseFloat(row.price_amount) || 0,
        type: row.transaction_type || 'sale'
      };
    }).filter(p => p.amount > 0);

    const rentPrices = prices.filter(p => p.type === 'rent').map(p => p.amount);
    const salePrices = prices.filter(p => p.type === 'sale').map(p => p.amount);

    // Calculate averages
    const avgRent = rentPrices.length > 0 
      ? rentPrices.reduce((a, b) => a + b, 0) / rentPrices.length 
      : 0;
    
    const avgSale = salePrices.length > 0 
      ? salePrices.reduce((a, b) => a + b, 0) / salePrices.length 
      : 0;

    // Property types
    const propertyTypes: Record<string, number> = {};
    typesResult.rows.forEach(row => {
      propertyTypes[row.property_type] = parseInt(row.count);
    });

    return {
      neighborhood: city,
      city,
      totalListings: parseInt(statsResult.rows[0].total),
      avgPriceRent: avgRent,
      avgPriceSale: avgSale,
      avgBedrooms: parseFloat(statsResult.rows[0].avg_bedrooms) || 0,
      avgBathrooms: parseFloat(statsResult.rows[0].avg_bathrooms) || 0,
      propertyTypes,
      priceRange: {
        min: Math.min(...prices.map(p => p.amount)),
        max: Math.max(...prices.map(p => p.amount))
      }
    };
  }

  /**
   * Calculate price bands for a neighborhood
   */
  private calculatePriceBands(stats: NeighborhoodStats): Record<'low' | 'medium' | 'high', { avg: number; count: number }> {
    // For simplicity, we'll use the overall average and create bands around it
    const avgPrice = (stats.avgPriceRent + stats.avgPriceSale) / 2;
    
    return {
      low: {
        avg: avgPrice * 0.7,
        count: Math.floor(stats.totalListings * 0.33)
      },
      medium: {
        avg: avgPrice,
        count: Math.floor(stats.totalListings * 0.34)
      },
      high: {
        avg: avgPrice * 1.5,
        count: Math.floor(stats.totalListings * 0.33)
      }
    };
  }

  /**
   * Generate summary text using AI
   */
  private async generateSummaryText(
    stats: NeighborhoodStats,
    priceBand: 'low' | 'medium' | 'high',
    bandInfo: { avg: number; count: number }
  ): Promise<string> {
    const bandLabels = {
      low: 'económica',
      medium: 'media',
      high: 'alta'
    };

    // Get top property types
    const topTypes = Object.entries(stats.propertyTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => this.translatePropertyType(type));

    const prompt = `
      Genera un resumen de mercado inmobiliario conciso (máximo 2 oraciones) para:
      
      Ciudad: ${stats.city}
      Banda de precio: ${bandLabels[priceBand]}
      Precio promedio: $${bandInfo.avg.toLocaleString('es-MX')} MXN
      Total de propiedades: ${bandInfo.count}
      Recámaras promedio: ${stats.avgBedrooms.toFixed(1)}
      Baños promedio: ${stats.avgBathrooms.toFixed(1)}
      Tipos de propiedad populares: ${topTypes.join(', ')}
      
      El resumen debe:
      1. Destacar las características distintivas de esta banda de precio
      2. Mencionar el tipo de compradores/inquilinos que podría atraer
      3. Ser informativo y atractivo para potenciales clientes
    `;

    try {
      const response = await getOpenAIService().openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en bienes raíces mexicano. Genera resúmenes concisos y útiles del mercado inmobiliario.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      return response.choices[0]?.message?.content || 'Resumen no disponible';
    } catch (error) {
      this.logger.error('Failed to generate summary text', error);
      // Fallback to a basic summary
      return `${stats.city} ofrece ${bandInfo.count} propiedades en el rango ${bandLabels[priceBand]} con un precio promedio de $${bandInfo.avg.toLocaleString('es-MX')} MXN.`;
    }
  }

  /**
   * Store summary in the database
   */
  private async storeSummary(summary: {
    neighborhood: string;
    city: string;
    summary: string;
    avgPriceRent: number;
    avgPriceSale: number;
    totalListings: number;
    priceBand: 'low' | 'medium' | 'high';
  }): Promise<void> {
    const query = `
      INSERT INTO neighborhood_summaries 
        (neighborhood, city, summary, avg_price_rent, avg_price_sale, total_listings, price_band)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (neighborhood, city, price_band) DO UPDATE
      SET 
        summary = $3,
        avg_price_rent = $4,
        avg_price_sale = $5,
        total_listings = $6,
        updated_at = NOW()
    `;

    await this.pool.query(query, [
      summary.neighborhood,
      summary.city,
      summary.summary,
      summary.avgPriceRent,
      summary.avgPriceSale,
      summary.totalListings,
      summary.priceBand
    ]);
  }

  /**
   * Translate property type to Spanish
   */
  private translatePropertyType(type: string): string {
    const translations: Record<string, string> = {
      'house': 'casa',
      'apartment': 'departamento',
      'condo': 'condominio',
      'commercial': 'comercial',
      'land': 'terreno'
    };
    return translations[type] || type;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Manual trigger to generate summary for specific city
   */
  async generateCitySummaryManual(city: string): Promise<void> {
    await this.generateCitySummary(city);
  }

  /**
   * Get worker status
   */
  getStatus(): { isRunning: boolean; lastRunTime: Date | null } {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime
    };
  }
}

// Export singleton instance factory
export function createSummaryWorker(pool: Pool, logger: Logger): SummaryWorker {
  return new SummaryWorker(pool, logger);
}