import { Request, Response, NextFunction } from 'express';
import { container } from '../container';
import * as Sentry from '@sentry/node';

// Extend Request to include startTime
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}

// HTTP request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const logger = container.get('logger');
  
  // Record start time
  req.startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    referrer: req.get('referrer')
  });

  // Capture response metrics
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    const responseTime = Date.now() - (req.startTime || Date.now());
    
    // Log response
    logger.http(req, res, responseTime);
    
    // Add response time header
    res.set('X-Response-Time', `${responseTime}ms`);
    
    // Send performance data to Sentry
    Sentry.getCurrentScope().setTag('http.status_code', res.statusCode);
    Sentry.getCurrentScope().setContext('response', {
      statusCode: res.statusCode,
      responseTime: responseTime
    });
    
    return res.send(data);
  };

  next();
}

// Performance monitoring middleware
export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  // Start timing
  const startTime = Date.now();
  
  // Track request in Sentry
  Sentry.getCurrentScope().setContext('http_request', {
    method: req.method,
    url: req.originalUrl,
    path: req.route?.path || req.path
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log performance metrics
    Sentry.getCurrentScope().setContext('performance', {
      duration: duration,
      statusCode: res.statusCode
    });
  });

  next();
}

// Error logging middleware
export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction) {
  const logger = container.get('logger');
  
  // Log error with context
  logger.error('Request error', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id
  });

  // Send to Sentry with additional context
  Sentry.withScope(scope => {
    scope.setTag('request.method', req.method);
    scope.setTag('request.url', req.originalUrl);
    scope.setContext('request', {
      headers: req.headers,
      query: req.query,
      body: req.body
    });
    if (req.user) {
      scope.setUser({
        id: req.user.id,
        email: req.user.email
      });
    }
    Sentry.captureException(err);
  });

  next(err);
}

// Health check endpoint that doesn't log
export function skipLogging(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  requestLogger(req, res, next);
}