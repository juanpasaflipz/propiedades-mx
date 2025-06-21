import OpenAI from 'openai';
import { Property } from '../models/property.model';
import { Logger } from '../utils/logger';

const logger = new Logger();

interface RankedProperty extends Property {
  relevanceScore: number;
  matchReason: string;
}

interface ReRankingOptions {
  query: string;
  properties: Property[];
  maxResults?: number;
  includeReasons?: boolean;
  language?: 'es' | 'en';
}

export class LLMReRankingService {
  private static instance: LLMReRankingService;
  private openai: OpenAI | null = null;

  private constructor() {}

  static getInstance(): LLMReRankingService {
    if (!LLMReRankingService.instance) {
      LLMReRankingService.instance = new LLMReRankingService();
    }
    return LLMReRankingService.instance;
  }

  private async initialize() {
    if (!this.openai && process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  async reRankProperties(options: ReRankingOptions): Promise<RankedProperty[]> {
    await this.initialize();

    if (!this.openai) {
      logger.warn('OpenAI not initialized, returning original properties');
      return options.properties.map(p => ({
        ...p,
        relevanceScore: 1,
        matchReason: 'No AI ranking available'
      }));
    }

    const {
      query,
      properties,
      maxResults = 10,
      includeReasons = true,
      language = 'es'
    } = options;

    try {
      const systemPrompt = language === 'es' 
        ? this.getSpanishSystemPrompt()
        : this.getEnglishSystemPrompt();

      const userPrompt = this.buildUserPrompt(query, properties, maxResults, includeReasons, language);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(response);
      return this.mapResponseToRankedProperties(result, properties, language);

    } catch (error) {
      logger.error('Error in LLM re-ranking:', error);
      return properties.slice(0, maxResults).map(p => ({
        ...p,
        relevanceScore: 1,
        matchReason: 'Error during ranking'
      }));
    }
  }

  private getSpanishSystemPrompt(): string {
    return `Eres un experto asistente inmobiliario especializado en el mercado mexicano. 
Tu tarea es analizar propiedades y re-ordenarlas según qué tan bien coinciden con la búsqueda del usuario.

Considera estos factores al evaluar las propiedades:
1. Coincidencia con los requisitos específicos del usuario
2. Ubicación y características del vecindario
3. Relación precio-valor
4. Características especiales mencionadas
5. Condición y edad de la propiedad

Debes responder en formato JSON con la siguiente estructura:
{
  "ranked_properties": [
    {
      "property_id": "id",
      "relevance_score": 0.95,
      "match_reason": "Razón específica por la cual esta propiedad es relevante"
    }
  ]
}`;
  }

  private getEnglishSystemPrompt(): string {
    return `You are an expert real estate assistant specializing in the Mexican market.
Your task is to analyze properties and re-rank them based on how well they match the user's search query.

Consider these factors when evaluating properties:
1. Match with user's specific requirements
2. Location and neighborhood features
3. Price-value relationship
4. Special features mentioned
5. Property condition and age

You must respond in JSON format with the following structure:
{
  "ranked_properties": [
    {
      "property_id": "id",
      "relevance_score": 0.95,
      "match_reason": "Specific reason why this property is relevant"
    }
  ]
}`;
  }

  private buildUserPrompt(
    query: string,
    properties: Property[],
    maxResults: number,
    includeReasons: boolean,
    language: 'es' | 'en'
  ): string {
    const propertyList = properties.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      price: p.price,
      location: p.location,
      propertyType: p.property_type,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      area: p.area_sqm,
      features: p.amenities
    }));

    if (language === 'es') {
      return `El usuario busca: "${query}"

Aquí están las propiedades a evaluar:
${JSON.stringify(propertyList, null, 2)}

Por favor:
1. Analiza qué tan bien cada propiedad coincide con la búsqueda
2. Asigna un puntaje de relevancia (0.0 a 1.0) donde 1.0 es una coincidencia perfecta
3. Ordena las propiedades de mayor a menor relevancia
4. Devuelve solo las ${maxResults} mejores propiedades
${includeReasons ? '5. Incluye una razón específica para cada propiedad explicando por qué coincide con la búsqueda' : ''}

Responde en el formato JSON especificado.`;
    } else {
      return `User is searching for: "${query}"

Here are the properties to evaluate:
${JSON.stringify(propertyList, null, 2)}

Please:
1. Analyze how well each property matches the search
2. Assign a relevance score (0.0 to 1.0) where 1.0 is a perfect match
3. Sort properties from highest to lowest relevance
4. Return only the top ${maxResults} properties
${includeReasons ? '5. Include a specific reason for each property explaining why it matches the search' : ''}

Respond in the specified JSON format.`;
    }
  }

  private mapResponseToRankedProperties(
    response: any,
    originalProperties: Property[],
    language: 'es' | 'en'
  ): RankedProperty[] {
    const rankedList = response.ranked_properties || [];
    const propertyMap = new Map(originalProperties.map(p => [p.id, p]));

    return rankedList
      .filter((item: any) => propertyMap.has(item.property_id))
      .map((item: any) => {
        const property = propertyMap.get(item.property_id)!;
        return {
          ...property,
          relevanceScore: item.relevance_score || 0.5,
          matchReason: item.match_reason || (
            language === 'es' 
              ? 'Propiedad relevante para tu búsqueda'
              : 'Property relevant to your search'
          )
        };
      });
  }

  async enhanceSearchWithContext(
    query: string,
    userPreferences?: {
      priceRange?: { min?: number; max?: number };
      propertyTypes?: string[];
      locations?: string[];
      minBedrooms?: number;
    }
  ): Promise<string> {
    await this.initialize();

    if (!this.openai) {
      return query;
    }

    try {
      const systemPrompt = `Eres un experto en búsquedas inmobiliarias. 
Tu tarea es mejorar las consultas de búsqueda agregando contexto relevante basado en las preferencias del usuario.
Mantén la esencia de la búsqueda original pero hazla más específica y útil.`;

      const userPrompt = `Búsqueda original: "${query}"

Preferencias del usuario:
${userPreferences ? JSON.stringify(userPreferences, null, 2) : 'No hay preferencias específicas'}

Mejora esta búsqueda manteniendo el idioma original y agregando contexto relevante.
Responde solo con la búsqueda mejorada, sin explicaciones adicionales.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 150
      });

      return completion.choices[0]?.message?.content?.trim() || query;

    } catch (error) {
      logger.error('Error enhancing search query:', error);
      return query;
    }
  }
}

export const llmReRankingService = LLMReRankingService.getInstance();