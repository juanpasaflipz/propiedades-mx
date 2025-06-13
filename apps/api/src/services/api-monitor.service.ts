import { Pool } from 'pg';

export interface ApiLogEntry {
  apiProvider: string;
  endpoint: string;
  method: string;
  requestParams?: any;
  responseStatus?: number;
  responseTimeMs?: number;
  errorMessage?: string;
  userIp?: string;
}

export interface ApiProvider {
  id: number;
  name: string;
  enabled: boolean;
  priority: number;
  baseUrl: string;
  apiKeyEnvVar: string;
  rateLimit: number;
}

export class ApiMonitorService {
  private pool: Pool | null = null;

  constructor() {
    if (process.env.DB_USER && process.env.DB_HOST) {
      this.pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT || '5432'),
      });
    }
  }

  async logApiCall(entry: ApiLogEntry): Promise<void> {
    if (!this.pool) return;

    try {
      const query = `
        INSERT INTO api_logs 
        (api_provider, endpoint, method, request_params, response_status, 
         response_time_ms, error_message, user_ip)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      await this.pool.query(query, [
        entry.apiProvider,
        entry.endpoint,
        entry.method,
        JSON.stringify(entry.requestParams),
        entry.responseStatus,
        entry.responseTimeMs,
        entry.errorMessage,
        entry.userIp,
      ]);
    } catch (error) {
      console.error('Error logging API call:', error);
    }
  }

  async getApiLogs(filters: {
    provider?: string;
    startDate?: Date;
    endDate?: Date;
    status?: number;
    limit?: number;
  }): Promise<any[]> {
    if (!this.pool) return [];

    let query = 'SELECT * FROM api_logs WHERE 1=1';
    const values: any[] = [];
    let paramCount = 0;

    if (filters.provider) {
      query += ` AND api_provider = $${++paramCount}`;
      values.push(filters.provider);
    }

    if (filters.startDate) {
      query += ` AND created_at >= $${++paramCount}`;
      values.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND created_at <= $${++paramCount}`;
      values.push(filters.endDate);
    }

    if (filters.status) {
      query += ` AND response_status = $${++paramCount}`;
      values.push(filters.status);
    }

    query += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
      query += ` LIMIT $${++paramCount}`;
      values.push(filters.limit);
    }

    try {
      const result = await this.pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error fetching API logs:', error);
      return [];
    }
  }

  async getApiProviders(): Promise<ApiProvider[]> {
    if (!this.pool) return [];

    try {
      const result = await this.pool.query(
        'SELECT * FROM api_providers ORDER BY priority ASC'
      );
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        enabled: row.enabled,
        priority: row.priority,
        baseUrl: row.base_url,
        apiKeyEnvVar: row.api_key_env_var,
        rateLimit: row.rate_limit,
      }));
    } catch (error) {
      console.error('Error fetching API providers:', error);
      return [];
    }
  }

  async updateApiProvider(id: number, updates: Partial<ApiProvider>): Promise<void> {
    if (!this.pool) return;

    const allowedFields = ['enabled', 'priority', 'rate_limit'];
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (updates.enabled !== undefined) {
      updateFields.push(`enabled = $${++paramCount}`);
      values.push(updates.enabled);
    }

    if (updates.priority !== undefined) {
      updateFields.push(`priority = $${++paramCount}`);
      values.push(updates.priority);
    }

    if (updates.rateLimit !== undefined) {
      updateFields.push(`rate_limit = $${++paramCount}`);
      values.push(updates.rateLimit);
    }

    if (updateFields.length === 0) return;

    values.push(id);
    const query = `
      UPDATE api_providers 
      SET ${updateFields.join(', ')}
      WHERE id = $${++paramCount}
    `;

    try {
      await this.pool.query(query, values);
    } catch (error) {
      console.error('Error updating API provider:', error);
      throw error;
    }
  }

  async getApiStats(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<any> {
    if (!this.pool) return null;

    const timeFilter = {
      hour: "created_at >= NOW() - INTERVAL '1 hour'",
      day: "created_at >= NOW() - INTERVAL '1 day'",
      week: "created_at >= NOW() - INTERVAL '1 week'",
      month: "created_at >= NOW() - INTERVAL '1 month'",
    }[timeRange];

    const query = `
      SELECT 
        api_provider,
        COUNT(*) as total_calls,
        COUNT(CASE WHEN response_status >= 200 AND response_status < 300 THEN 1 END) as successful_calls,
        COUNT(CASE WHEN response_status >= 400 THEN 1 END) as failed_calls,
        AVG(response_time_ms) as avg_response_time,
        MAX(response_time_ms) as max_response_time,
        MIN(response_time_ms) as min_response_time
      FROM api_logs
      WHERE ${timeFilter}
      GROUP BY api_provider
      ORDER BY total_calls DESC
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching API stats:', error);
      return null;
    }
  }
}