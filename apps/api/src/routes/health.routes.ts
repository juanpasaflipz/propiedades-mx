import { Router, Request, Response } from 'express';
import { container } from '../container';
import { env } from '../config/env';
import { Pool } from 'pg';

const router = Router();

// Basic health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV
  });
});

// Detailed health check with database status
router.get('/api/health', async (req: Request, res: Response) => {
  const logger = container.get('logger');
  const db = container.get('db');
  
  let databaseStatus = 'unknown';
  let tableExists = false;
  let propertyCount = 0;
  let dbVersion = '';
  
  try {
    // Test database connection
    const versionResult = await db.query('SELECT version()');
    dbVersion = versionResult.rows[0].version;
    
    // Check if properties table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'properties'
      );
    `);
    tableExists = tableCheck.rows[0].exists;
    
    if (tableExists) {
      const countResult = await db.query('SELECT COUNT(*) FROM properties');
      propertyCount = parseInt(countResult.rows[0].count);
      databaseStatus = 'connected';
    } else {
      databaseStatus = 'table_missing';
    }
  } catch (error: any) {
    logger.error('Health check database error', error);
    databaseStatus = `error: ${error.message}`;
  }
  
  const healthStatus = {
    status: databaseStatus === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: '1.0.0',
    services: {
      api: 'operational',
      database: {
        status: databaseStatus,
        version: dbVersion,
        tableExists,
        propertyCount
      },
      sentry: env.SENTRY_DSN ? 'configured' : 'not_configured'
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      cpu: process.cpuUsage()
    }
  };
  
  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

// Database columns check
router.get('/api/db-columns', async (req: Request, res: Response) => {
  const pool = container.get('pool') as Pool;
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'properties'
      ORDER BY ordinal_position
    `);
    
    res.json({
      status: 'ok',
      columns: result.rows
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Container test endpoint
router.get('/api/container-test', async (req: Request, res: Response) => {
  try {
    const tests = {
      logger: false,
      db: false,
      pool: false,
      propertyService: false,
      propertyController: false
    };
    
    // Test each dependency
    try {
      container.get('logger');
      tests.logger = true;
    } catch (e: any) {
      tests.logger = e.message;
    }
    
    try {
      container.get('db');
      tests.db = true;
    } catch (e: any) {
      tests.db = e.message;
    }
    
    try {
      container.get('pool');
      tests.pool = true;
    } catch (e: any) {
      tests.pool = e.message;
    }
    
    try {
      container.get('propertyService');
      tests.propertyService = true;
    } catch (e: any) {
      tests.propertyService = e.message;
    }
    
    try {
      container.get('propertyController');
      tests.propertyController = true;
    } catch (e: any) {
      tests.propertyController = e.message;
    }
    
    res.json({
      status: 'container-test',
      tests
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Get distinct cities
router.get('/api/cities', async (req: Request, res: Response) => {
  try {
    const pool = container.get('pool') as Pool;
    const result = await pool.query(`
      SELECT DISTINCT city, COUNT(*) as count 
      FROM properties 
      WHERE city IS NOT NULL 
      GROUP BY city 
      ORDER BY count DESC
      LIMIT 20
    `);
    
    res.json({
      success: true,
      cities: result.rows,
      total: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch cities' 
    });
  }
});

export { router as healthRoutes };