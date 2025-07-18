import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import { env } from './config/env';
import { initSentry, sentryErrorHandler } from './config/sentry';
import { container } from './container';
import { skipLogging, performanceMonitor, errorLogger } from './middleware/monitoring';

// Import routes
import { propertyRoutes } from './routes/property.routes';
import { adminRoutes } from './routes/admin.routes';
import aiRoutes from './routes/ai/ai.routes';
import { authRoutes } from './routes/auth.routes';
import { healthRoutes } from './routes/health.routes';
import { createAIEnhancedRoutes } from './routes/ai-enhanced.routes';
import mcpRoutes from './routes/mcp.routes';
import context7Routes from './routes/context7.routes';

// Import workers
import { createEmbeddingWorker } from './workers/embedding-worker';
import { createSummaryWorker } from './workers/summary-worker';

// Initialize Sentry before creating Express app
initSentry();

const app = express();

// Enable trust proxy for Render deployment
app.set('trust proxy', true);

// Get logger from container
const logger = container.get('logger');

// Add request context to Sentry
app.use((req, res, next) => {
  Sentry.getCurrentScope().setContext('request', {
    method: req.method,
    url: req.url,
    headers: req.headers,
  });
  next();
});

const port = env.PORT;
logger.info('Starting server', { port, environment: env.NODE_ENV });

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// CORS configuration
const getAllowedOrigins = () => {
  const origins = [env.FRONTEND_URL];
  
  // Add additional origins from ALLOWED_ORIGINS env var
  if (env.ALLOWED_ORIGINS) {
    const additionalOrigins = env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    origins.push(...additionalOrigins);
  }
  
  // Always allow Vercel preview deployments in production
  if (env.NODE_ENV === 'production') {
    origins.push(/^https:\/\/propiedades-mx-.*\.vercel\.app$/);
  }
  
  return origins;
};

const corsOptions = {
  origin: env.NODE_ENV === 'production' 
    ? (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();
        
        // Check if origin matches any allowed origin
        const isAllowed = !origin || allowedOrigins.some(allowed => {
          if (allowed instanceof RegExp) {
            return allowed.test(origin);
          }
          return allowed === origin;
        });
        
        if (isAllowed) {
          callback(null, true);
        } else {
          logger.warn('CORS blocked origin', { origin, allowedOrigins });
          callback(new Error('Not allowed by CORS'));
        }
      }
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  }
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (skip for health checks)
app.use(skipLogging);

// Performance monitoring
app.use(performanceMonitor);

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
        byCity: '/api/properties/city/:city',
        stats: '/api/properties/stats'
      },
      admin: {
        apiLogs: '/api/admin/api-logs',
        apiProviders: '/api/admin/api-providers'
      },
      auth: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        refresh: '/api/auth/refresh',
        logout: '/api/auth/logout',
        me: '/api/auth/me'
      }
    }
  });
});

// Health check routes (before other routes)
app.use('/', healthRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/context7', context7Routes);

// Enhanced AI routes with RAG
const pool = container.get('pool');
app.use('/api/ai/v2', createAIEnhancedRoutes(pool, logger));

// Debug routes (only in development)
if (env.NODE_ENV !== 'production') {
  const { createDebugRoutes } = require('./routes/debug.routes');
  const pool = container.get('pool');
  app.use('/api/debug', createDebugRoutes(pool, logger));
}

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    success: false
  });
});

// Sentry error handler must go before any other error middleware
app.use(sentryErrorHandler);

// Error logging middleware
app.use(errorLogger);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Log error details
  logger.error('Unhandled error in request', err, {
    method: req.method,
    url: req.url,
    body: req.body,
    query: req.query,
    headers: req.headers
  });
  
  // Default to 500 server error
  const statusCode = err.statusCode || err.status || 500;
  
  // Prepare error response
  const errorResponse: any = {
    error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    success: false,
    statusCode
  };

  // Add stack trace in development
  if (env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  logger.info('Server started successfully', {
    port,
    environment: env.NODE_ENV,
    nodeVersion: process.version,
    pid: process.pid
  });

  // Start background workers in production
  if (env.NODE_ENV === 'production' || process.env.ENABLE_WORKERS === 'true') {
    logger.info('Starting background workers');
    
    const embeddingWorker = createEmbeddingWorker(pool, logger);
    const summaryWorker = createSummaryWorker(pool, logger);
    
    embeddingWorker.start().catch(error => {
      logger.error('Failed to start embedding worker', error);
    });
    
    summaryWorker.start().catch(error => {
      logger.error('Failed to start summary worker', error);
    });
    
    // Store workers for graceful shutdown
    (global as any).workers = { embeddingWorker, summaryWorker };
  }
});

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, starting graceful shutdown`);
  
  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Stop workers if running
  const workers = (global as any).workers;
  if (workers) {
    logger.info('Stopping background workers');
    workers.embeddingWorker?.stop();
    workers.summaryWorker?.stop();
  }

  // Close database connections
  try {
    await container.dispose();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections', error);
  }

  // Exit process
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  
  // In production, try to gracefully shutdown
  if (env.NODE_ENV === 'production') {
    gracefulShutdown('uncaughtException');
  } else {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', reason as Error, {
    promise: promise.toString()
  });
  
  // In production, try to gracefully shutdown
  if (env.NODE_ENV === 'production') {
    gracefulShutdown('unhandledRejection');
  } else {
    process.exit(1);
  }
});

export { app, server };