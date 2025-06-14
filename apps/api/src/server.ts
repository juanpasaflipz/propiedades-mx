import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { propertyRoutes } from './routes/property.routes';
import { adminRoutes } from './routes/admin.routes';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3003', 10);
console.log('Environment PORT:', process.env.PORT);
console.log('Using port:', port);

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://yourdomain.com'
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
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

// Routes
app.use('/api/properties', propertyRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoints (both paths for compatibility)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
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