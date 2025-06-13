import { Request, Response, NextFunction } from 'express';
import { ApiMonitorService } from '../services/api-monitor.service';

// Extend Express Request type to include monitoring data
declare global {
  namespace Express {
    interface Request {
      apiMonitoring?: {
        provider: string;
        startTime: number;
      };
    }
  }
}

const apiMonitorService = new ApiMonitorService();

export const apiMonitoringMiddleware = (provider: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Start timing
    req.apiMonitoring = {
      provider,
      startTime: Date.now(),
    };

    // Capture the original end function
    const originalEnd = res.end;

    // Override the end function to log the API call
    res.end = function(this: Response, ...args: any[]): Response {
      // Calculate response time
      const responseTime = Date.now() - (req.apiMonitoring?.startTime || Date.now());

      // Log the API call
      apiMonitorService.logApiCall({
        apiProvider: provider,
        endpoint: req.originalUrl || req.url,
        method: req.method,
        requestParams: {
          query: req.query,
          body: req.body,
        },
        responseStatus: res.statusCode,
        responseTimeMs: responseTime,
        userIp: req.ip || req.socket.remoteAddress,
      }).catch(console.error);

      // Call the original end function
      return originalEnd.apply(this, args as any);
    } as any;

    next();
  };
};