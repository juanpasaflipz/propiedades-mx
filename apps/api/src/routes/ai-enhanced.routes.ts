import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { validateBody } from '../middleware/validation';
import { getPropertyEnhancedService } from '../services/property-enhanced.service';
import { getEmbeddingService } from '../services/embedding.service';
import { getOpenAIService } from '../services/openai.service';
import { llmReRankingService } from '../services/llm-reranking.service';
import { Logger } from '../utils/logger';
import { z } from 'zod';
import { Property } from '../models/property.model';

// Validation schemas
const SemanticSearchSchema = z.object({
  query: z.string().min(1).max(500),
  filters: z.object({
    city: z.string().optional(),
    propertyType: z.string().optional(),
    transactionType: z.enum(['rent', 'sale']).optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    minBedrooms: z.number().optional(),
    maxBedrooms: z.number().optional(),
  }).optional(),
  limit: z.number().min(1).max(50).default(20),
  includeExplanation: z.boolean().default(false),
  useLLMReranking: z.boolean().default(true),
  language: z.enum(['es', 'en']).default('es')
});

const SimilarPropertiesSchema = z.object({
  propertyId: z.string().min(1),
  limit: z.number().min(1).max(20).default(10)
});

const NeighborhoodInsightsSchema = z.object({
  neighborhood: z.string().min(1),
  city: z.string().min(1)
});

const ConversationalSearchSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationId: z.string().optional(),
  context: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional()
});

export function createAIEnhancedRoutes(pool: Pool, logger: Logger): Router {
  const router = Router();
  const propertyService = getPropertyEnhancedService(pool, logger);

  /**
   * Semantic property search using natural language
   */
  router.post('/semantic-search', validateBody(SemanticSearchSchema), async (req: Request, res: Response) => {
    try {
      const { query, filters, limit, includeExplanation, useLLMReranking, language } = req.body;
      
      logger.info('Semantic search request', { query, filters, useLLMReranking });

      // First, get semantic search results
      const results = await propertyService.semanticSearch({
        query,
        filters,
        limit: useLLMReranking ? limit * 2 : limit, // Get more results if re-ranking
        includeExplanation
      });

      // Apply LLM re-ranking if enabled
      if (useLLMReranking && results.properties.length > 0) {
        const properties = results.properties.map(p => p.property);
        
        const rankedProperties = await llmReRankingService.reRankProperties({
          query,
          properties,
          maxResults: limit,
          includeReasons: includeExplanation,
          language
        });

        // Map back to the original format with scores and reasons
        const reRankedResults = rankedProperties.map(rankedProp => {
          const original = results.properties.find(p => p.property.id === rankedProp.id);
          return {
            property: rankedProp,
            score: rankedProp.relevanceScore,
            explanation: includeExplanation ? rankedProp.matchReason : undefined,
            distance: original?.distance
          };
        });

        res.json({
          success: true,
          properties: reRankedResults,
          searchContext: {
            ...results.searchContext,
            llmReranked: true,
            language
          }
        });
      } else {
        res.json({
          success: true,
          ...results
        });
      }

    } catch (error) {
      logger.error('Semantic search error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform semantic search'
      });
    }
  });

  /**
   * Enhance search query with context and user preferences
   */
  router.post('/enhance-query', async (req: Request, res: Response) => {
    try {
      const { query, userPreferences } = req.body;
      
      logger.info('Enhance query request', { query });

      const enhancedQuery = await llmReRankingService.enhanceSearchWithContext(
        query,
        userPreferences
      );

      res.json({
        success: true,
        originalQuery: query,
        enhancedQuery,
        userPreferences
      });

    } catch (error) {
      logger.error('Enhance query error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to enhance search query'
      });
    }
  });

  /**
   * Find similar properties based on a given property
   */
  router.post('/similar-properties', validateBody(SimilarPropertiesSchema), async (req: Request, res: Response) => {
    try {
      const { propertyId, limit } = req.body;
      
      logger.info('Similar properties request', { propertyId, limit });

      const similarProperties = await propertyService.findSimilarProperties(propertyId, limit);

      res.json({
        success: true,
        sourcePropertyId: propertyId,
        similarProperties
      });

    } catch (error) {
      logger.error('Similar properties error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to find similar properties'
      });
    }
  });

  /**
   * Get AI-powered neighborhood insights
   */
  router.post('/neighborhood-insights', validateBody(NeighborhoodInsightsSchema), async (req: Request, res: Response) => {
    try {
      const { neighborhood, city } = req.body;
      
      logger.info('Neighborhood insights request', { neighborhood, city });

      const insights = await propertyService.getNeighborhoodInsights(neighborhood, city);

      res.json({
        success: true,
        insights
      });

    } catch (error) {
      logger.error('Neighborhood insights error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get neighborhood insights'
      });
    }
  });

  /**
   * Conversational property search with context awareness
   */
  router.post('/conversational-search', validateBody(ConversationalSearchSchema), async (req: Request, res: Response) => {
    try {
      const { message, conversationId, context = [] } = req.body;
      
      logger.info('Conversational search request', { message, conversationId });

      // Build conversation history
      const messages = [
        {
          role: 'system' as const,
          content: `You are a helpful real estate assistant for Mexico. 
          Help users find properties based on their needs. 
          Extract search criteria from the conversation and provide helpful recommendations.
          Always respond in the same language as the user.`
        },
        ...context,
        { role: 'user' as const, content: message }
      ];

      // Get AI response with search intent
      const completion = await getOpenAIService().getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
        functions: [{
          name: 'search_properties',
          description: 'Search for properties based on criteria',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Natural language search query' },
              filters: {
                type: 'object',
                properties: {
                  city: { type: 'string' },
                  propertyType: { type: 'string' },
                  minPrice: { type: 'number' },
                  maxPrice: { type: 'number' },
                  bedrooms: { type: 'number' }
                }
              }
            },
            required: ['query']
          }
        }]
      });

      const aiResponse = completion.choices[0].message;
      
      // Check if AI wants to search for properties
      if (aiResponse.function_call?.name === 'search_properties') {
        const searchParams = JSON.parse(aiResponse.function_call.arguments);
        
        // Perform semantic search
        const searchResults = await propertyService.semanticSearch({
          query: searchParams.query,
          filters: searchParams.filters,
          limit: 5,
          includeExplanation: true
        });

        // Generate conversational response with results
        const responseCompletion = await getOpenAIService().getOpenAIClient().chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            ...messages,
            {
              role: 'assistant',
              content: `I found ${searchResults.properties.length} properties matching your criteria.`
            },
            {
              role: 'system',
              content: `Here are the search results: ${JSON.stringify(searchResults.properties.map(p => ({
                id: p.property.id,
                location: `${p.property.neighborhood}, ${p.property.city}`,
                price: p.property.price,
                bedrooms: p.property.bedrooms,
                bathrooms: p.property.bathrooms,
                type: p.property.property_type,
                description: p.property.description.slice(0, 100)
              })))}`
            },
            {
              role: 'user',
              content: 'Present these results in a helpful, conversational way.'
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        });

        res.json({
          success: true,
          conversationId: conversationId || generateConversationId(),
          response: responseCompletion.choices[0].message.content,
          properties: searchResults.properties,
          searchContext: searchResults.searchContext
        });

      } else {
        // Regular conversational response without search
        res.json({
          success: true,
          conversationId: conversationId || generateConversationId(),
          response: aiResponse.content,
          properties: []
        });
      }

    } catch (error) {
      logger.error('Conversational search error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process conversational search'
      });
    }
  });

  /**
   * Generate property listing description using AI
   */
  router.post('/generate-description', async (req: Request, res: Response) => {
    try {
      const { propertyId, style = 'professional' } = req.body;
      
      logger.info('Generate description request', { propertyId, style });

      // Get property details
      const property = await propertyService.getPropertyById(propertyId);
      if (!property) {
        return res.status(404).json({
          success: false,
          error: 'Property not found'
        });
      }

      // Generate enhanced description
      const prompt = `
        Create an engaging property listing description in Spanish.
        Style: ${style} (professional/casual/luxury)
        
        Property details:
        - Type: ${property.property_type}
        - Location: ${property.neighborhood}, ${property.city}
        - Price: $${property.price.amount.toLocaleString()} ${property.price.currency}
        - Bedrooms: ${property.bedrooms}
        - Bathrooms: ${property.bathrooms}
        - Amenities: ${property.amenities.join(', ')}
        - Current description: ${property.description}
        
        Create a compelling 2-3 paragraph description that highlights the property's best features.
      `;

      const completion = await getOpenAIService().getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional real estate copywriter.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 300
      });

      res.json({
        success: true,
        propertyId,
        originalDescription: property.description,
        enhancedDescription: completion.choices[0].message.content
      });

    } catch (error) {
      logger.error('Generate description error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate description'
      });
    }
  });

  /**
   * Manually generate embeddings for properties
   */
  router.post('/generate-embeddings', async (req: Request, res: Response) => {
    try {
      const { propertyIds, regenerate = false } = req.body;
      
      logger.info('Manual embedding generation request', { 
        propertyIds: propertyIds?.length || 'all',
        regenerate 
      });

      const embeddingService = getEmbeddingService();
      let properties: Property[] = [];

      if (propertyIds && propertyIds.length > 0) {
        // Generate embeddings for specific properties
        properties = await Promise.all(
          propertyIds.map((id: string) => propertyService.getPropertyById(id))
        );
        properties = properties.filter(p => p !== null);
      } else {
        // Get all properties without embeddings or regenerate all
        const query = regenerate 
          ? 'SELECT * FROM properties WHERE active = true ORDER BY created_at DESC'
          : `SELECT p.* FROM properties p 
             LEFT JOIN property_embeddings pe ON p.id = pe.property_id 
             WHERE p.active = true AND pe.property_id IS NULL 
             ORDER BY p.created_at DESC`;
        
        const result = await pool.query(query);
        properties = result.rows;
      }

      logger.info(`Generating embeddings for ${properties.length} properties`);

      // Generate embeddings in batches
      const embeddings = await embeddingService.generateBatchEmbeddings(properties);
      
      // Store embeddings in database
      let successCount = 0;
      for (const [propertyId, embedding] of embeddings) {
        try {
          await pool.query(
            `INSERT INTO property_embeddings (property_id, embedding, created_at, updated_at)
             VALUES ($1, $2, NOW(), NOW())
             ON CONFLICT (property_id) 
             DO UPDATE SET embedding = $2, updated_at = NOW()`,
            [propertyId, JSON.stringify(embedding)]
          );
          successCount++;
        } catch (error) {
          logger.error(`Failed to store embedding for property ${propertyId}`, error);
        }
      }

      res.json({
        success: true,
        totalProperties: properties.length,
        embeddingsGenerated: successCount,
        message: `Successfully generated ${successCount} embeddings`
      });

    } catch (error) {
      logger.error('Generate embeddings error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate embeddings'
      });
    }
  });

  /**
   * Get embedding statistics
   */
  router.get('/embedding-stats', async (req: Request, res: Response) => {
    try {
      const stats = await pool.query(`
        SELECT 
          COUNT(DISTINCT p.id) as total_properties,
          COUNT(DISTINCT pe.property_id) as properties_with_embeddings,
          COUNT(DISTINCT p.id) - COUNT(DISTINCT pe.property_id) as properties_without_embeddings,
          MIN(pe.created_at) as oldest_embedding,
          MAX(pe.created_at) as newest_embedding
        FROM properties p
        LEFT JOIN property_embeddings pe ON p.id = pe.property_id
        WHERE p.active = true
      `);

      res.json({
        success: true,
        stats: stats.rows[0]
      });

    } catch (error) {
      logger.error('Embedding stats error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get embedding statistics'
      });
    }
  });

  /**
   * Analyze property images using vision models (placeholder for future)
   */
  router.post('/analyze-images', async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.body;
      
      logger.info('Analyze images request', { propertyId });

      // Get property details
      const property = await propertyService.getPropertyById(propertyId);
      if (!property) {
        return res.status(404).json({
          success: false,
          error: 'Property not found'
        });
      }

      // For now, return a placeholder response
      // In the future, this could use GPT-4 Vision or similar
      res.json({
        success: true,
        propertyId,
        imageCount: property.images.length,
        analysis: {
          quality: 'good',
          features: ['exterior', 'living room', 'kitchen'],
          suggestions: ['Add more bedroom photos', 'Include bathroom images']
        }
      });

    } catch (error) {
      logger.error('Analyze images error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze images'
      });
    }
  });

  return router;
}

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}