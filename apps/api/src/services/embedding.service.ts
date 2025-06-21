import OpenAI from 'openai';
import { LRUCache } from 'lru-cache';
import { Property } from '../models/property.model';

export class EmbeddingService {
  private openai: OpenAI;
  private embeddingCache: LRUCache<string, number[]>;
  private readonly EMBEDDING_MODEL = 'text-embedding-ada-002';
  private readonly EMBEDDING_DIMENSION = 1536;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Cache embeddings to avoid redundant API calls
    this.embeddingCache = new LRUCache<string, number[]>({
      max: 1000,
      ttl: 1000 * 60 * 60 * 24, // 24 hours
    });
  }

  /**
   * Generate embedding for a property listing
   */
  async generatePropertyEmbedding(property: Property, language: 'es' | 'en' = 'es'): Promise<number[]> {
    const text = this.createPropertyText(property, language);
    return this.embedText(text);
  }

  /**
   * Generate embedding for a search query
   */
  async generateQueryEmbedding(query: string, language: 'es' | 'en' = 'es'): Promise<number[]> {
    // Enhance query with context for better matching
    const enhancedQuery = language === 'es' 
      ? `Busco propiedad: ${query}`
      : `Looking for property: ${query}`;
    return this.embedText(enhancedQuery);
  }

  /**
   * Generate embeddings for multiple properties (batch processing)
   */
  async generateBatchEmbeddings(properties: Property[]): Promise<Map<string, number[]>> {
    const results = new Map<string, number[]>();
    const batchSize = 10;

    for (let i = 0; i < properties.length; i += batchSize) {
      const batch = properties.slice(i, i + batchSize);
      const embeddings = await Promise.all(
        batch.map(property => this.generatePropertyEmbedding(property))
      );

      batch.forEach((property, index) => {
        results.set(property.id, embeddings[index]);
      });

      // Rate limiting between batches
      if (i + batchSize < properties.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Create text representation of property for embedding
   */
  private createPropertyText(property: Property, language: 'es' | 'en' = 'es'): string {
    const parts: string[] = [];

    if (language === 'es') {
      // Spanish version
      // Location information
      parts.push(`${property.property_type} en ${property.neighborhood}, ${property.city}`);
      
      // Property characteristics
      parts.push(`${property.bedrooms} recámaras, ${property.bathrooms} baños`);
      
      // Size
      if (property.area_sqm > 0) {
        parts.push(`${property.area_sqm} metros cuadrados`);
      }
      
      // Transaction type and price
      const transactionType = property.transaction_type === 'rent' ? 'renta' : 'venta';
      parts.push(`En ${transactionType} por $${property.price.amount.toLocaleString()} ${property.price.currency}`);
      
      // Amenities
      if (property.amenities && property.amenities.length > 0) {
        parts.push(`Amenidades: ${property.amenities.join(', ')}`);
      }
      
      // Description (truncated to avoid token limits)
      if (property.description) {
        const truncatedDescription = property.description.slice(0, 500);
        parts.push(`Descripción: ${truncatedDescription}`);
      }
    } else {
      // English version
      // Location information
      parts.push(`${property.property_type} in ${property.neighborhood}, ${property.city}`);
      
      // Property characteristics
      parts.push(`${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms`);
      
      // Size
      if (property.area_sqm > 0) {
        parts.push(`${property.area_sqm} square meters`);
      }
      
      // Transaction type and price
      const transactionType = property.transaction_type === 'rent' ? 'rent' : 'sale';
      parts.push(`For ${transactionType} at $${property.price.amount.toLocaleString()} ${property.price.currency}`);
      
      // Amenities
      if (property.amenities && property.amenities.length > 0) {
        parts.push(`Amenities: ${property.amenities.join(', ')}`);
      }
      
      // Description (truncated to avoid token limits)
      if (property.description) {
        const truncatedDescription = property.description.slice(0, 500);
        parts.push(`Description: ${truncatedDescription}`);
      }
    }

    return parts.join('. ');
  }

  /**
   * Generate embedding for text with caching and retry logic
   */
  private async embedText(text: string): Promise<number[]> {
    // Check cache first
    const cached = this.embeddingCache.get(text);
    if (cached) {
      return cached;
    }

    // Normalize text
    const normalizedText = this.normalizeText(text);
    
    // Generate embedding with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const response = await this.openai.embeddings.create({
          model: this.EMBEDDING_MODEL,
          input: normalizedText,
        });

        const embedding = response.data[0].embedding;
        
        // Cache the result
        this.embeddingCache.set(text, embedding);
        
        return embedding;
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }

    throw new Error('Failed to create embedding after max attempts');
  }

  /**
   * Normalize text for consistent embeddings
   */
  private normalizeText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .slice(0, 8000); // Limit text length for embedding model
  }

  /**
   * Detect language of text (simple heuristic)
   */
  detectLanguage(text: string): 'es' | 'en' {
    const spanishKeywords = [
      'casa', 'departamento', 'terreno', 'oficina', 'local',
      'recámara', 'baño', 'cocina', 'jardín', 'alberca',
      'cerca', 'busco', 'quiero', 'necesito', 'con', 'sin',
      'zona', 'colonia', 'fraccionamiento', 'precio', 'renta',
      'venta', 'metros', 'cuadrados', 'habitaciones'
    ];
    
    const englishKeywords = [
      'house', 'apartment', 'condo', 'office', 'land',
      'bedroom', 'bathroom', 'kitchen', 'garden', 'pool',
      'near', 'looking', 'want', 'need', 'with', 'without',
      'area', 'neighborhood', 'price', 'rent', 'sale',
      'square', 'feet', 'meters', 'rooms'
    ];
    
    const lowerText = text.toLowerCase();
    
    const spanishScore = spanishKeywords.filter(keyword => 
      lowerText.includes(keyword)
    ).length;
    
    const englishScore = englishKeywords.filter(keyword => 
      lowerText.includes(keyword)
    ).length;
    
    // Default to Spanish for Mexican real estate market
    return spanishScore >= englishScore ? 'es' : 'en';
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// Singleton instance
let embeddingService: EmbeddingService | null = null;

export function getEmbeddingService(): EmbeddingService {
  if (!embeddingService && process.env.OPENAI_API_KEY) {
    embeddingService = new EmbeddingService();
  }
  if (!embeddingService) {
    throw new Error('Embedding service not initialized');
  }
  return embeddingService;
}