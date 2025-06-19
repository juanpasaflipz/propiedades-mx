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
        OR p.last_updated > pe.updated_at
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
    return {
      id: row.id.toString(),
      source: row.source,
      country: row.country || 'Mexico',
      state_province: row.state_province || '',
      city: row.city || '',
      neighborhood: row.neighborhood || '',
      postal_code: row.postal_code || '',
      address: row.address || '',
      coordinates: {
        lat: parseFloat(row.coordinates_lat) || 0,
        lng: parseFloat(row.coordinates_lng) || 0
      },
      transaction_type: row.transaction_type || 'sale',
      price: {
        amount: parseFloat(row.price_amount) || 0,
        currency: row.price_currency || 'MXN'
      },
      property_type: row.property_type || 'house',
      bedrooms: row.bedrooms || 0,
      bathrooms: row.bathrooms || 0,
      area_sqm: parseFloat(row.area_sqm) || 0,
      lot_size_sqm: parseFloat(row.lot_size_sqm) || 0,
      amenities: row.amenities || [],
      images: row.images || [],
      description: row.description || '',
      contact_info: row.contact_info || '',
      listing_date: row.listing_date || new Date().toISOString(),
      last_updated: row.last_updated || new Date().toISOString()
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