import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables first, before importing routes
dotenv.config();

import { propertyRoutes } from './routes/property.routes';
import { adminRoutes } from './routes/admin.routes';
import { aiRoutes } from './routes/ai.routes';
import { authRoutes } from './routes/auth.routes';
import { PropertyService } from './services/property.service';

const app = express();
const port = parseInt(process.env.PORT || '3003', 10);
console.log('Environment PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
console.log('Using port:', port);

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://yourdomain.com'
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Real Estate Aggregator API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      properties: {
        search: '/api/properties/search',
        byId: '/api/properties/:id',
        byCountry: '/api/properties/country/:country',
        byCity: '/api/properties/city/:city'
      },
      admin: {
        apiLogs: '/api/admin/api-logs',
        apiProviders: '/api/admin/api-providers'
      }
    }
  });
});

// Test endpoint for debugging
app.get('/api/test-db', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.json({ error: 'No DATABASE_URL configured' });
  }
  
  // Parse connection URL to avoid IPv6 issues
  const connectionUrl = new URL(process.env.DATABASE_URL);
  const pool = new Pool({
    user: connectionUrl.username,
    password: connectionUrl.password,
    host: connectionUrl.hostname,
    port: parseInt(connectionUrl.port),
    database: connectionUrl.pathname.slice(1),
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    // Test basic query
    const result = await pool.query('SELECT * FROM properties LIMIT 1');
    const columns = Object.keys(result.rows[0] || {});
    
    res.json({
      success: true,
      rowCount: result.rowCount,
      columns: columns,
      sampleRow: result.rows[0]
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message,
      hint: error.hint,
      detail: error.detail
    });
  } finally {
    await pool.end();
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoints (both paths for compatibility)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', async (req, res) => {
  let databaseStatus = 'unknown';
  let tableExists = false;
  let propertyCount = 0;
  
  try {
    // Test database connection
    const propertyService = new PropertyService();
    if (process.env.DATABASE_URL) {
      // Check if properties table exists
      // Parse connection URL to avoid IPv6 issues
      const connectionUrl = new URL(process.env.DATABASE_URL);
      const pool = new Pool({
        user: connectionUrl.username,
        password: connectionUrl.password,
        host: connectionUrl.hostname,
        port: parseInt(connectionUrl.port),
        database: connectionUrl.pathname.slice(1),
        ssl: { rejectUnauthorized: false }
      });
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'properties'
        );
      `);
      tableExists = tableCheck.rows[0].exists;
      
      if (tableExists) {
        const countResult = await pool.query('SELECT COUNT(*) FROM properties');
        propertyCount = parseInt(countResult.rows[0].count);
        
        // Get column information
        const columnsQuery = await pool.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'properties'
          ORDER BY ordinal_position;
        `);
        
        databaseStatus = 'connected';
        res.locals.columns = columnsQuery.rows;
      } else {
        databaseStatus = 'table_missing';
      }
      await pool.end();
    } else {
      databaseStatus = 'not_configured';
    }
  } catch (error) {
    databaseStatus = 'error: ' + error.message;
  }
  
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: databaseStatus,
      tableExists,
      propertyCount,
      hasUrl: !!process.env.DATABASE_URL,
      columns: res.locals.columns || []
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(err.status || 500).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Health check available at http://0.0.0.0:${port}/health`);
});

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit on uncaught exceptions in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejections in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
}); 