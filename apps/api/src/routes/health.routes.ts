import { Router, Request, Response } from 'express';
import { container } from '../container';
import { env } from '../config/env';

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

export { router as healthRoutes };