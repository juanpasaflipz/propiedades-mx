import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, errors, json, prettyPrint, colorize, printf } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

export class Logger {
  private logger: winston.Logger;

  constructor() {
    const isDevelopment = env.NODE_ENV === 'development';
    const isTest = env.NODE_ENV === 'test';

    this.logger = winston.createLogger({
      level: isDevelopment ? 'debug' : 'info',
      silent: isTest,
      format: combine(
        errors({ stack: true }),
        timestamp(),
        json()
      ),
      defaultMeta: { 
        service: 'api',
        environment: env.NODE_ENV 
      },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: isDevelopment 
            ? combine(
                colorize(),
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                consoleFormat
              )
            : json()
        })
      ]
    });

    // Add file transport in production
    if (!isDevelopment && !isTest) {
      this.logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }));

      this.logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }));
    }
  }

  // Main logging methods
  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error | any, meta?: any) {
    this.logger.error(message, {
      ...meta,
      error: error?.message,
      stack: error?.stack,
      code: error?.code
    });
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }

  // HTTP request logging
  http(req: any, res: any, responseTime: number) {
    const { method, originalUrl, ip, headers } = req;
    const { statusCode } = res;
    
    const logData = {
      method,
      url: originalUrl,
      status: statusCode,
      responseTime: `${responseTime}ms`,
      ip: ip || req.connection.remoteAddress,
      userAgent: headers['user-agent'],
      referrer: headers.referrer || headers.referer
    };

    if (statusCode >= 400) {
      this.warn('HTTP Request Error', logData);
    } else {
      this.info('HTTP Request', logData);
    }
  }

  // Database query logging
  query(query: string, params?: any[], duration?: number) {
    this.debug('Database Query', {
      query: query.substring(0, 1000), // Truncate long queries
      params: params?.map(p => typeof p === 'string' && p.length > 100 ? p.substring(0, 100) + '...' : p),
      duration: duration ? `${duration}ms` : undefined
    });
  }

  // Performance logging
  performance(operation: string, duration: number, metadata?: any) {
    const logData = {
      operation,
      duration: `${duration}ms`,
      ...metadata
    };

    if (duration > 1000) {
      this.warn('Slow operation detected', logData);
    } else {
      this.debug('Operation completed', logData);
    }
  }

  // Create child logger with additional context
  child(defaultMeta: any): Logger {
    const childLogger = new Logger();
    childLogger.logger = this.logger.child(defaultMeta);
    return childLogger;
  }
}