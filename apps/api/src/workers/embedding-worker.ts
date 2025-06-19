import { Pool } from 'pg';
import { getEmbeddingService } from '../services/embedding.service';
import { Logger } from '../utils/logger';
import { Property } from '../models/property.model';

export class EmbeddingWorker {
  private isRunning = false;
  private batchSize = 50;
  private processInterval = 60000; // 1 minute

  constructor(
    private pool: Pool,
    private logger: Logger
  ) {}

  async start() {
    if (this.isRunning) {
      this.logger.warn('Embedding worker already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting embedding worker');

    while (this.isRunning) {
      try {
        await this.processUnembeddedProperties();
        await this.updateStaleEmbeddings();
        await this.sleep(this.processInterval);
      } catch (error) {
        this.logger.error('Error in embedding worker cycle', error);
        await this.sleep(5000); // Retry after 5 seconds on error
      }
    }
  }

  stop() {
    this.isRunning = false;
    this.logger.info('Stopping embedding worker');
  }

  /**
   * Process properties that don't have embeddings yet
   */
  private async processUnembeddedProperties() {
    const startTime = Date.now();
    
    try {
      // Find properties without embeddings
      const query = `
        SELECT p.* 
        FROM properties p
        LEFT JOIN property_embeddings pe ON p.id::varchar = pe.property_id
        WHERE pe.property_id IS NULL
        LIMIT $1
      `;
      
      const result = await this.pool.query(query, [this.batchSize]);
      
      if (result.rows.length === 0) {
        return;
      }

      this.logger.info(`Processing ${result.rows.length} properties without embeddings`);

      // Convert to Property objects
      const properties = result.rows.map(row => this.mapDbRowToProperty(row));

      // Generate embeddings in batch
      const embeddingService = getEmbeddingService();
      const embeddings = await embeddingService.generateBatchEmbeddings(properties);

      // Store embeddings
      for (const [propertyId, embedding] of embeddings.entries()) {
        await this.storeEmbedding(propertyId, embedding);
      }

      const duration = Date.now() - startTime;
      this.logger.info(`Processed ${embeddings.size} property embeddings in ${duration}ms`);

    } catch (error) {
      this.logger.error('Failed to process unembedded properties', error);
    }
  }

  /**
   * Update embeddings for properties that have been recently modified
   */
  private async updateStaleEmbeddings() {
    const startTime = Date.now();
    
    try {
      // Find properties with stale embeddings (updated after embedding was created)
      const query = `
        SELECT p.*, pe.created_at as embedding_created_at
        FROM properties p
        INNER JOIN property_embeddings pe ON p.id::varchar = pe.property_id
        WHERE p.updated_at > pe.updated_at
        OR p.last_seen_at > pe.updated_at
        LIMIT $1
      `;
      
      const result = await this.pool.query(query, [this.batchSize]);
      
      if (result.rows.length === 0) {
        return;
      }

      this.logger.info(`Updating ${result.rows.length} stale embeddings`);

      // Convert to Property objects
      const properties = result.rows.map(row => this.mapDbRowToProperty(row));

      // Generate new embeddings
      const embeddingService = getEmbeddingService();
      const embeddings = await embeddingService.generateBatchEmbeddings(properties);

      // Update embeddings
      for (const [propertyId, embedding] of embeddings.entries()) {
        await this.updateEmbedding(propertyId, embedding);
      }

      const duration = Date.now() - startTime;
      this.logger.info(`Updated ${embeddings.size} property embeddings in ${duration}ms`);

    } catch (error) {
      this.logger.error('Failed to update stale embeddings', error);
    }
  }

  /**
   * Store a new embedding
   */
  private async storeEmbedding(propertyId: string, embedding: number[]): Promise<void> {
    const query = `
      INSERT INTO property_embeddings (property_id, embedding)
      VALUES ($1, $2::vector)
    `;
    
    try {
      await this.pool.query(query, [propertyId, `[${embedding.join(',')}]`]);
    } catch (error) {
      this.logger.error(`Failed to store embedding for property ${propertyId}`, error);
    }
  }

  /**
   * Update an existing embedding
   */
  private async updateEmbedding(propertyId: string, embedding: number[]): Promise<void> {
    const query = `
      UPDATE property_embeddings 
      SET embedding = $2::vector, updated_at = NOW()
      WHERE property_id = $1
    `;
    
    try {
      await this.pool.query(query, [propertyId, `[${embedding.join(',')}]`]);
    } catch (error) {
      this.logger.error(`Failed to update embedding for property ${propertyId}`, error);
    }
  }

  /**
   * Map database row to Property object (same as in property service)
   */
  private mapDbRowToProperty(row: any): Property {
    const parsePrice = (priceStr: string | null): number => {
      if (!priceStr) return 0;
      const numStr = priceStr.replace(/[^0-9.]/g, '');
      return parseFloat(numStr) || 0;
    };

    return {
      id: row.id.toString(),
      source: row.source,
      country: row.country || 'Mexico',
      state_province: row.state || '',
      city: row.city || '',
      neighborhood: '',
      postal_code: '',
      address: row.location || '',
      coordinates: {
        lat: 0,
        lng: 0
      },
      transaction_type: 'sale',
      price: {
        amount: parsePrice(row.price),
        currency: row.currency || 'MXN'
      },
      property_type: row.property_type || 'house',
      bedrooms: row.bedrooms || 0,
      bathrooms: row.bathrooms || 0,
      area_sqm: 0,
      lot_size_sqm: 0,
      amenities: [],
      images: row.image_url ? [row.image_url] : [],
      description: row.description || row.title || '',
      contact_info: row.link || '',
      listing_date: row.created_at || new Date().toISOString(),
      last_updated: row.updated_at || row.last_seen_at || new Date().toISOString()
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Manual trigger to process specific properties
   */
  async processPropertyEmbeddings(propertyIds: string[]): Promise<void> {
    this.logger.info(`Manually processing embeddings for ${propertyIds.length} properties`);

    try {
      // Get properties
      const query = `
        SELECT * FROM properties 
        WHERE id = ANY($1::int[])
      `;
      
      const result = await this.pool.query(query, [propertyIds]);
      const properties = result.rows.map(row => this.mapDbRowToProperty(row));

      // Generate embeddings
      const embeddingService = getEmbeddingService();
      const embeddings = await embeddingService.generateBatchEmbeddings(properties);

      // Store/update embeddings
      for (const [propertyId, embedding] of embeddings.entries()) {
        await this.storeEmbedding(propertyId, embedding);
      }

      this.logger.info(`Successfully processed ${embeddings.size} embeddings`);
    } catch (error) {
      this.logger.error('Failed to process property embeddings', error);
      throw error;
    }
  }
}

// Export singleton instance factory
export function createEmbeddingWorker(pool: Pool, logger: Logger): EmbeddingWorker {
  return new EmbeddingWorker(pool, logger);
}