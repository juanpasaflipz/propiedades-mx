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
    
    // Send Sentry performance data
    const transaction = Sentry.getCurrentScope().getTransaction();
    if (transaction) {
      transaction.setHttpStatus(res.statusCode);
      transaction.setTag('http.status_code', res.statusCode);
    }
    
    return res.send(data);
  };

  next();
}

// Performance monitoring middleware
export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  const transaction = Sentry.startTransaction({
    op: 'http.request',
    name: `${req.method} ${req.route?.path || req.path}`,
    data: {
      method: req.method,
      url: req.originalUrl,
    }
  });

  Sentry.getCurrentScope().setSpan(transaction);

  res.on('finish', () => {
    transaction.setHttpStatus(res.statusCode);
    transaction.finish();
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