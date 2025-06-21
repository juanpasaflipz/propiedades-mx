import OpenAI from 'openai';
import { PropertySearchFilters } from '../types';

export class OpenAIService {
  protected openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async parseSearchQuery(query: string): Promise<PropertySearchFilters> {
    try {
      const systemPrompt = `You are a real estate search assistant. Parse natural language queries into structured search filters.
      
Extract the following information from the user's query:
- location: city or area name
- minPrice: minimum price (number)
- maxPrice: maximum price (number)
- bedrooms: number of bedrooms
- bathrooms: number of bathrooms
- propertyType: one of [house, apartment, condo, commercial, land]
- minArea: minimum area in square meters
- maxArea: maximum area in square meters

Return a JSON object with only the fields that were mentioned in the query.
If a field is not mentioned, do not include it in the response.

Examples:
"casas en polanco bajo 5 millones" -> {"location": "polanco", "propertyType": "house", "maxPrice": 5000000}
"departamento 2 recámaras en roma norte" -> {"location": "roma norte", "propertyType": "apartment", "bedrooms": 2}
"oficinas en santa fe arriba de 200 m2" -> {"location": "santa fe", "propertyType": "commercial", "minArea": 200}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 200,
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from OpenAI');
      }

      const filters = JSON.parse(result) as PropertySearchFilters;
      
      // Validate and clean the filters
      const cleanedFilters: PropertySearchFilters = {};
      
      if (filters.location && typeof filters.location === 'string') {
        cleanedFilters.location = filters.location;
      }
      if (filters.minPrice && typeof filters.minPrice === 'number') {
        cleanedFilters.minPrice = filters.minPrice;
      }
      if (filters.maxPrice && typeof filters.maxPrice === 'number') {
        cleanedFilters.maxPrice = filters.maxPrice;
      }
      if (filters.bedrooms && typeof filters.bedrooms === 'number') {
        cleanedFilters.bedrooms = filters.bedrooms;
      }
      if (filters.bathrooms && typeof filters.bathrooms === 'number') {
        cleanedFilters.bathrooms = filters.bathrooms;
      }
      if (filters.propertyType && ['house', 'apartment', 'condo', 'commercial', 'land'].includes(filters.propertyType)) {
        cleanedFilters.propertyType = filters.propertyType as any;
      }
      if (filters.minArea && typeof filters.minArea === 'number') {
        cleanedFilters.minArea = filters.minArea;
      }
      if (filters.maxArea && typeof filters.maxArea === 'number') {
        cleanedFilters.maxArea = filters.maxArea;
      }

      console.log('OpenAI parsed query:', query, '->', cleanedFilters);
      return cleanedFilters;

    } catch (error) {
      console.error('OpenAI parsing error:', error);
      throw new Error('Failed to parse search query with OpenAI');
    }
  }

  async optimizeSearchQuery(query: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a real estate search optimizer. Improve search queries to be more specific and effective. Keep responses concise.'
          },
          {
            role: 'user',
            content: `Optimize this real estate search query for better results: "${query}"`
          }
        ],
        temperature: 0.5,
        max_tokens: 100,
      });

      return completion.choices[0]?.message?.content || query;
    } catch (error) {
      console.error('OpenAI optimization error:', error);
      return query; // Return original query if optimization fails
    }
  }
}

// Singleton instance
let openAIService: OpenAIService | null = null;

export function getOpenAIService(): OpenAIService {
  if (!openAIService && process.env.OPENAI_API_KEY) {
    openAIService = new OpenAIService();
  }
  if (!openAIService) {
    throw new Error('OpenAI service not initialized');
  }
  return openAIService;
}