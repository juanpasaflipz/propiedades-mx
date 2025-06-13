import { Request, Response } from 'express';
import { ApiMonitorService } from '../services/api-monitor.service';

export class AdminController {
  private apiMonitorService: ApiMonitorService;

  constructor() {
    this.apiMonitorService = new ApiMonitorService();
  }

  getApiLogs = async (req: Request, res: Response) => {
    try {
      const { provider, startDate, endDate, status, limit = 100 } = req.query;
      
      const logs = await this.apiMonitorService.getApiLogs({
        provider: provider as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        status: status ? parseInt(status as string) : undefined,
        limit: parseInt(limit as string),
      });
      
      res.json({ logs });
    } catch (error) {
      console.error('Error fetching API logs:', error);
      res.status(500).json({ error: 'Failed to fetch API logs' });
    }
  };

  getApiStats = async (req: Request, res: Response) => {
    try {
      const { timeRange = 'day' } = req.query;
      
      if (!['hour', 'day', 'week', 'month'].includes(timeRange as string)) {
        return res.status(400).json({ error: 'Invalid time range' });
      }
      
      const stats = await this.apiMonitorService.getApiStats(
        timeRange as 'hour' | 'day' | 'week' | 'month'
      );
      
      res.json({ stats });
    } catch (error) {
      console.error('Error fetching API stats:', error);
      res.status(500).json({ error: 'Failed to fetch API stats' });
    }
  };

  getApiProviders = async (req: Request, res: Response) => {
    try {
      const providers = await this.apiMonitorService.getApiProviders();
      res.json({ providers });
    } catch (error) {
      console.error('Error fetching API providers:', error);
      res.status(500).json({ error: 'Failed to fetch API providers' });
    }
  };

  updateApiProvider = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { enabled, priority, rateLimit } = req.body;
      
      await this.apiMonitorService.updateApiProvider(parseInt(id), {
        enabled,
        priority,
        rateLimit,
      });
      
      res.json({ success: true, message: 'API provider updated successfully' });
    } catch (error) {
      console.error('Error updating API provider:', error);
      res.status(500).json({ error: 'Failed to update API provider' });
    }
  };
}