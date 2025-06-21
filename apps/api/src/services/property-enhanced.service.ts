import { Pool } from 'pg';
import { Property } from '../models/property.model';
import { Logger } from '../utils/logger';
import { PropertySearch } from '../validation/property.schemas';
import { PropertyService } from './property.service';
import { getEmbeddingService } from './embedding.service';
import { getOpenAIService } from './openai.service';

interface SemanticSearchOptions {
  query: string;
  filters?: PropertySearch;
  limit?: number;
  includeExplanation?: boolean;
}

interface SemanticSearchResult {
  properties: Array<{
    property: Property;
    similarity: number;
    explanation?: string;
  }>;
  searchContext?: string;
  detectedLanguage?: 'es' | 'en';
}

export class PropertyEnhancedService extends PropertyService {
  constructor(pool: Pool, logger: Logger) {
    super(pool, logger);
  }

  /**
   * Semantic search for properties using natural language
   */
  async semanticSearch(options: SemanticSearchOptions): Promise<SemanticSearchResult> {
    const startTime = Date.now();
    const { query, filters = {}, limit = 20, includeExplanation = false } = options;
    
    this.logger.info('Starting semantic search', { query, filters });

    try {
      // 1. Detect language from query
      const language = getEmbeddingService().detectLanguage(query);
      
      // 2. Parse natural language query to extract structured filters
      const parsedFilters = await getOpenAIService().parseSearchQuery(query);
      const combinedFilters = { ...filters, ...parsedFilters };

      // 3. Generate embedding for the search query with detected language
      const queryEmbedding = await getEmbeddingService().generateQueryEmbedding(query, language);

      // 3. Find similar properties using vector search
      const similarProperties = await this.findSimilarPropertiesByEmbedding(
        queryEmbedding,
        combinedFilters,
        limit * 2 // Get more candidates for filtering
      );

      // 4. If we have filters, apply them to narrow down results
      let filteredProperties = similarProperties;
      if (Object.keys(combinedFilters).length > 0) {
        const sqlFilteredIds = await this.getFilteredPropertyIds(combinedFilters);
        filteredProperties = similarProperties.filter(sp => 
          sqlFilteredIds.includes(sp.property_id)
        );
      }

      // 5. Get full property details
      const results = await Promise.all(
        filteredProperties.slice(0, limit).map(async (sp) => {
          const property = await this.getPropertyById(sp.property_id);
          if (!property) return null;

          const result: any = {
            property,
            similarity: sp.similarity
          };

          // 6. Generate explanations if requested
          if (includeExplanation) {
            result.explanation = await this.generatePropertyExplanation(
              property,
              query,
              sp.similarity
            );
          }

          return result;
        })
      );

      // Filter out null results
      const validResults = results.filter(r => r !== null);

      const duration = Date.now() - startTime;
      this.logger.info('Semantic search completed', {
        query,
        resultsCount: validResults.length,
        duration
      });

      return {
        properties: validResults,
        searchContext: await this.generateSearchContext(query, combinedFilters, validResults.length),
        detectedLanguage: language
      };
    } catch (error) {
      this.logger.error('Semantic search failed', error);
      throw error;
    }
  }

  /**
   * Find similar properties to a given property
   */
  async findSimilarProperties(
    propertyId: string,
    limit: number = 10
  ): Promise<Array<{ property: Property; similarity: number }>> {
    this.logger.info('Finding similar properties', { propertyId, limit });

    try {
      // Get the source property
      const sourceProperty = await this.getPropertyById(propertyId);
      if (!sourceProperty) {
        throw new Error('Property not found');
      }

      // Get or generate embedding for the source property
      const embedding = await this.getOrGeneratePropertyEmbedding(propertyId, sourceProperty);

      // Find similar properties
      const similarProperties = await this.findSimilarPropertiesByEmbedding(
        embedding,
        {
          // Exclude the source property and filter by same transaction type
          transactionType: sourceProperty.transaction_type
        },
        limit + 1 // Get one extra to exclude source
      );

      // Get full property details
      const results = await Promise.all(
        similarProperties
          .filter(sp => sp.property_id !== propertyId)
          .slice(0, limit)
          .map(async (sp) => {
            const property = await this.getPropertyById(sp.property_id);
            if (!property) return null;
            return {
              property,
              similarity: sp.similarity
            };
          })
      );

      return results.filter(r => r !== null);
    } catch (error) {
      this.logger.error('Failed to find similar properties', error);
      throw error;
    }
  }

  /**
   * Get neighborhood insights using aggregated data
   */
  async getNeighborhoodInsights(
    neighborhood: string,
    city: string
  ): Promise<any> {
    this.logger.info('Getting neighborhood insights', { neighborhood, city });

    try {
      // Get neighborhood summary from database
      const summaryQuery = `
        SELECT * FROM neighborhood_summaries 
        WHERE LOWER(neighborhood) = LOWER($1) 
        AND LOWER(city) = LOWER($2)
        ORDER BY updated_at DESC
        LIMIT 1
      `;
      
      const summaryResult = await this.pool.query(summaryQuery, [neighborhood, city]);
      
      if (summaryResult.rows.length === 0) {
        // Generate insights on the fly if not cached
        return this.generateNeighborhoodInsights(neighborhood, city);
      }

      const summary = summaryResult.rows[0];

      // Get recent properties for context
      const propertiesQuery = `
        SELECT * FROM properties 
        WHERE LOWER(city) = LOWER($1) 
        LIMIT 10
      `;
      
      const propertiesResult = await this.pool.query(propertiesQuery, [city]);
      const properties = propertiesResult.rows.map(row => this.mapDbRowToProperty(row));

      return {
        neighborhood,
        city,
        summary: summary.summary,
        statistics: {
          avgPriceRent: summary.avg_price_rent,
          avgPriceSale: summary.avg_price_sale,
          totalListings: summary.total_listings,
          priceBand: summary.price_band
        },
        recentListings: properties.slice(0, 5),
        lastUpdated: summary.updated_at
      };
    } catch (error) {
      this.logger.error('Failed to get neighborhood insights', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private async findSimilarPropertiesByEmbedding(
    embedding: number[],
    filters: any,
    limit: number
  ): Promise<Array<{ property_id: string; similarity: number }>> {
    // Use the vector similarity search function
    const query = `
      SELECT * FROM search_similar_properties($1::vector, $2, $3)
    `;
    
    const result = await this.pool.query(query, [
      `[${embedding.join(',')}]`,
      0.5, // Similarity threshold
      limit
    ]);

    return result.rows;
  }

  private async getFilteredPropertyIds(filters: PropertySearch): Promise<string[]> {
    // Reuse the existing search logic but only get IDs
    const properties = await this.searchProperties({
      ...filters,
      page: 1,
      limit: 1000, // Get more IDs for vector filtering
      sortOrder: 'desc' as const
    });
    
    return properties.map(p => p.id);
  }

  private async getOrGeneratePropertyEmbedding(
    propertyId: string,
    property: Property
  ): Promise<number[]> {
    // Check if embedding exists
    const query = 'SELECT embedding FROM property_embeddings WHERE property_id = $1';
    const result = await this.pool.query(query, [propertyId]);

    if (result.rows.length > 0 && result.rows[0].embedding) {
      // Parse the vector string to number array
      const embeddingStr = result.rows[0].embedding;
      return JSON.parse(embeddingStr.replace(/[\[\]]/g, '').split(','));
    }

    // Generate new embedding
    const embedding = await getEmbeddingService().generatePropertyEmbedding(property);
    
    // Store it for future use
    await this.storePropertyEmbedding(propertyId, embedding);
    
    return embedding;
  }

  private async storePropertyEmbedding(propertyId: string, embedding: number[]): Promise<void> {
    const query = `
      INSERT INTO property_embeddings (property_id, embedding)
      VALUES ($1, $2::vector)
      ON CONFLICT (property_id) DO UPDATE
      SET embedding = $2::vector, updated_at = NOW()
    `;
    
    await this.pool.query(query, [propertyId, `[${embedding.join(',')}]`]);
  }

  private async generatePropertyExplanation(
    property: Property,
    query: string,
    similarity: number
  ): Promise<string> {
    const prompt = `
      Explain why this property matches the search query.
      
      Search query: "${query}"
      
      Property details:
      - Location: ${property.neighborhood}, ${property.city}
      - Type: ${property.property_type}
      - Price: $${property.price.amount.toLocaleString()} ${property.price.currency}
      - Bedrooms: ${property.bedrooms}
      - Bathrooms: ${property.bathrooms}
      - Description: ${property.description.slice(0, 200)}...
      
      Similarity score: ${(similarity * 100).toFixed(1)}%
      
      Provide a brief, helpful explanation in 1-2 sentences about why this property is a good match.
      Respond in the same language as the search query.
    `;

    const response = await getOpenAIService().getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful real estate assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    return response.choices[0]?.message?.content || 'This property matches your search criteria.';
  }

  private async generateSearchContext(
    query: string,
    filters: any,
    resultsCount: number
  ): Promise<string> {
    if (resultsCount === 0) {
      return 'No se encontraron propiedades que coincidan con tu búsqueda. Intenta con otros criterios.';
    }

    const filtersSummary = Object.entries(filters)
      .filter(([_, value]) => value != null)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    return `Encontré ${resultsCount} propiedades que coinciden con "${query}"${filtersSummary ? ` (${filtersSummary})` : ''}.`;
  }

  private async generateNeighborhoodInsights(
    neighborhood: string,
    city: string
  ): Promise<any> {
    // Get properties in the area
    const query = `
      SELECT * FROM properties 
      WHERE LOWER(city) = LOWER($1)
      LIMIT 50
    `;
    
    const result = await this.pool.query(query, [city]);
    const properties = result.rows.map(row => this.mapDbRowToProperty(row));

    if (properties.length === 0) {
      return {
        neighborhood,
        city,
        summary: 'No hay suficientes datos para generar información sobre esta zona.',
        statistics: null,
        recentListings: []
      };
    }

    // Calculate basic statistics
    const prices = properties
      .map(p => p.price.amount)
      .filter(p => p > 0);
    
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const avgBedrooms = properties.reduce((a, b) => a + b.bedrooms, 0) / properties.length;

    // Generate summary using OpenAI
    const summaryPrompt = `
      Generate a brief market summary for ${neighborhood}, ${city} based on these statistics:
      - Average price: $${avgPrice.toLocaleString()} MXN
      - Average bedrooms: ${avgBedrooms.toFixed(1)}
      - Total listings: ${properties.length}
      
      Write 2-3 sentences in Spanish highlighting key characteristics and market appeal.
    `;

    const summary = await getOpenAIService().optimizeSearchQuery(summaryPrompt);

    return {
      neighborhood,
      city,
      summary,
      statistics: {
        avgPrice,
        avgBedrooms,
        totalListings: properties.length
      },
      recentListings: properties.slice(0, 5),
      lastUpdated: new Date()
    };
  }
}

// Export enhanced service
export function getPropertyEnhancedService(pool: Pool, logger: Logger): PropertyEnhancedService {
  return new PropertyEnhancedService(pool, logger);
}