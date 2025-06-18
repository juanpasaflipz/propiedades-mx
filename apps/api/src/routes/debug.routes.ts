import { Router } from 'express';
import { Pool } from 'pg';
import { Logger } from '../utils/logger';

export function createDebugRoutes(pool: Pool, logger: Logger): Router {
  const router = Router();

  // Check database tables
  router.get('/tables', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      res.json({
        success: true,
        tables: result.rows.map(row => row.table_name)
      });
    } catch (error: any) {
      logger.error('Failed to list tables', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Check properties table structure
  router.get('/schema/properties', async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'properties'
        ORDER BY ordinal_position
      `);
      
      res.json({
        success: true,
        columns: result.rows
      });
    } catch (error: any) {
      logger.error('Failed to get properties schema', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Test database connection
  router.get('/db-test', async (req, res) => {
    try {
      const result = await pool.query('SELECT NOW() as now, current_database() as database');
      res.json({
        success: true,
        ...result.rows[0]
      });
    } catch (error: any) {
      logger.error('Database connection test failed', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Count properties
  router.get('/count', async (req, res) => {
    try {
      const result = await pool.query('SELECT COUNT(*) as count FROM properties');
      res.json({
        success: true,
        count: parseInt(result.rows[0].count)
      });
    } catch (error: any) {
      logger.error('Failed to count properties', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}