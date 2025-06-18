import { Request, Response, NextFunction } from 'express';
import { ApiMonitorService } from '../services/api-monitor.service';
import { Logger } from '../utils/logger';
import { z } from 'zod';

// Validation schemas
const ApiLogsQuerySchema = z.object({
  provider: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.preprocess(
    (val) => val ? Number(val) : undefined,
    z.number().int().min(100).max(599).optional()
  ),
  limit: z.preprocess(
    (val) => val ? Number(val) : 100,
    z.number().int().min(1).max(1000).default(100)
  )
});

const ApiStatsQuerySchema = z.object({
  timeRange: z.enum(['hour', 'day', 'week', 'month']).default('day')
});

const UpdateApiProviderSchema = z.object({
  enabled: z.boolean().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  rateLimit: z.number().int().min(0).optional()
});

export class AdminController {
  constructor(
    private apiMonitorService: ApiMonitorService,
    private logger: Logger
  ) {}

  getApiLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validatedQuery = ApiLogsQuerySchema.parse(req.query);
      
      this.logger.info('Admin API logs request', {
        filters: validatedQuery,
        adminId: req.user?.id
      });

      const logs = await this.apiMonitorService.getApiLogs({
        provider: validatedQuery.provider,
        startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
        endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
        status: validatedQuery.status,
        limit: validatedQuery.limit,
      });
      
      res.json({ 
        logs,
        count: logs.length,
        success: true
      });

      this.logger.info('API logs retrieved', {
        count: logs.length,
        adminId: req.user?.id
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid query parameters',
          details: error.errors,
          success: false
        });
      }
      next(error);
    }
  };

  getApiStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const { timeRange } = ApiStatsQuerySchema.parse(req.query);
      
      this.logger.info('Admin API stats request', {
        timeRange,
        adminId: req.user?.id
      });
      
      const stats = await this.apiMonitorService.getApiStats(timeRange);
      
      res.json({ 
        stats,
        timeRange,
        success: true
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid query parameters',
          details: error.errors,
          success: false
        });
      }
      next(error);
    }
  };

  getApiProviders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.logger.info('Admin API providers request', {
        adminId: req.user?.id
      });

      const providers = await this.apiMonitorService.getApiProviders();
      
      res.json({ 
        providers,
        count: providers.length,
        success: true
      });

    } catch (error) {
      next(error);
    }
  };

  updateApiProvider = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const providerId = parseInt(id);

      if (isNaN(providerId)) {
        return res.status(400).json({ 
          error: 'Invalid provider ID',
          success: false
        });
      }

      // Validate request body
      const updates = UpdateApiProviderSchema.parse(req.body);
      
      this.logger.info('Admin API provider update request', {
        providerId,
        updates,
        adminId: req.user?.id
      });

      await this.apiMonitorService.updateApiProvider(providerId, updates);
      
      res.json({ 
        success: true, 
        message: 'API provider updated successfully',
        providerId
      });

      this.logger.info('API provider updated', {
        providerId,
        adminId: req.user?.id
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid update parameters',
          details: error.errors,
          success: false
        });
      }
      next(error);
    }
  };

  getScraperStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.logger.info('Admin scraper status request', {
        adminId: req.user?.id
      });

      // TODO: Implement getScraperStatus in ApiMonitorService
      // const status = await this.apiMonitorService.getScraperStatus();
      
      res.json({ 
        scrapers: [],
        success: true,
        message: 'Scraper status endpoint not yet implemented'
      });

    } catch (error) {
      next(error);
    }
  };
}