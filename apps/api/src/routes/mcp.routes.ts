import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { mcpService } from '../services/mcp.service';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

const router = Router();

// Schema validation
const QuerySchema = z.object({
  query: z.string().min(1).max(5000),
});

const NaturalLanguageQuerySchema = z.object({
  question: z.string().min(1).max(500),
});

// Middleware to ensure MCP is connected
const ensureMCPConnection = async (req: any, res: any, next: any) => {
  try {
    await mcpService.connect();
    next();
  } catch (error) {
    logger.error('MCP connection failed:', error);
    next(new AppError('MCP service unavailable', 503));
  }
};

// Get database schema information
router.get('/schema', authenticate, ensureMCPConnection, async (req, res, next) => {
  try {
    const schemaInfo = await mcpService.getSchemaInfo();
    res.json({
      success: true,
      data: schemaInfo,
    });
  } catch (error) {
    next(new AppError('Failed to retrieve schema information', 500));
  }
});

// Execute a read-only query
router.post('/query', authenticate, ensureMCPConnection, async (req, res, next) => {
  try {
    const { query } = QuerySchema.parse(req.body);
    
    // Additional safety check - ensure query is read-only
    const readOnlyPattern = /^\s*(SELECT|WITH|EXPLAIN)/i;
    if (!readOnlyPattern.test(query)) {
      throw new AppError('Only read-only queries are allowed', 400);
    }

    const result = await mcpService.executeQuery(query);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Invalid query format', 400));
    } else {
      next(error);
    }
  }
});

// Natural language property search using MCP
router.post('/search/natural', authenticate, ensureMCPConnection, async (req, res, next) => {
  try {
    const { question } = NaturalLanguageQuerySchema.parse(req.body);
    
    // Generate SQL from natural language
    const sqlQuery = await mcpService.analyzePropertyQuery(question);
    
    // Execute the generated query
    const result = await mcpService.executeQuery(sqlQuery);
    
    res.json({
      success: true,
      data: {
        question,
        generatedQuery: sqlQuery,
        results: result,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new AppError('Invalid question format', 400));
    } else {
      next(error);
    }
  }
});

// Get database health metrics
router.get('/health', authenticate, ensureMCPConnection, async (req, res, next) => {
  try {
    const healthData = await mcpService.getDatabaseHealth();
    
    res.json({
      success: true,
      data: {
        metrics: healthData.rows[0],
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(new AppError('Failed to retrieve health metrics', 500));
  }
});

// Property insights using MCP
router.get('/insights/properties/:id', authenticate, ensureMCPConnection, async (req, res, next) => {
  try {
    const propertyId = parseInt(req.params.id);
    
    // Get similar properties using vector similarity
    const similarQuery = `
      SELECT 
        p.id,
        p.title,
        p.price,
        p.location,
        pe1.embedding <-> pe2.embedding as similarity_score
      FROM properties p
      JOIN property_embeddings pe1 ON p.id = pe1.property_id
      JOIN property_embeddings pe2 ON pe2.property_id = $1
      WHERE p.id != $1 AND p.active = true
      ORDER BY similarity_score
      LIMIT 5
    `;
    
    const similarProperties = await mcpService.executeQuery(
      similarQuery.replace(/\$1/g, propertyId.toString())
    );
    
    // Get neighborhood statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_properties,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(area) as avg_area
      FROM properties p
      WHERE p.active = true
        AND p.location = (SELECT location FROM properties WHERE id = ${propertyId})
    `;
    
    const neighborhoodStats = await mcpService.executeQuery(statsQuery);
    
    res.json({
      success: true,
      data: {
        similarProperties: similarProperties.rows,
        neighborhoodStats: neighborhoodStats.rows[0],
      },
    });
  } catch (error) {
    next(new AppError('Failed to get property insights', 500));
  }
});

export default router;