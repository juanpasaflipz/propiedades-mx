import { Pool } from 'pg';
import { env } from '../config/env';
import { PropertyService } from '../services/property.service';
import { AuthService } from '../services/auth.service';
import { ApiMonitorService } from '../services/api-monitor.service';
import { OpenAIService } from '../services/openai.service';
import { PropertyController } from '../controllers/property.controller';
import { AdminController } from '../controllers/admin.controller';
import { Logger } from '../utils/logger';

export interface Container {
  // Database
  db: Pool;
  pool: Pool; // alias for db
  
  // Services
  propertyService: PropertyService;
  authService: AuthService;
  apiMonitorService: ApiMonitorService;
  openAIService: OpenAIService;
  
  // Controllers
  propertyController: PropertyController;
  adminController: AdminController;
  
  // Utils
  logger: Logger;
}

class DIContainer {
  private instances: Map<keyof Container, any> = new Map();
  private factories: Map<keyof Container, () => any> = new Map();

  constructor() {
    this.registerFactories();
  }

  private registerFactories() {
    // Database
    const poolFactory = () => new Pool({
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    this.register('db', poolFactory);
    this.register('pool', poolFactory); // alias for compatibility

    // Logger (created first as services depend on it)
    this.register('logger', () => new Logger());

    // Services
    this.register('propertyService', () => new PropertyService(
      this.get('db'),
      this.get('logger')
    ));

    this.register('authService', () => new AuthService(
      this.get('db'),
      this.get('logger')
    ));

    this.register('apiMonitorService', () => new ApiMonitorService(
      this.get('db'),
      this.get('logger')
    ));

    this.register('openAIService', () => new OpenAIService(
      this.get('logger')
    ));

    // Controllers
    this.register('propertyController', () => new PropertyController(
      this.get('propertyService'),
      this.get('logger')
    ));

    this.register('adminController', () => new AdminController(
      this.get('apiMonitorService'),
      this.get('logger')
    ));
  }

  register<K extends keyof Container>(key: K, factory: () => Container[K]) {
    this.factories.set(key, factory);
  }

  get<K extends keyof Container>(key: K): Container[K] {
    // Special handling for pool alias
    if (key === 'pool') {
      return this.get('db') as any;
    }
    
    if (!this.instances.has(key)) {
      const factory = this.factories.get(key);
      if (!factory) {
        throw new Error(`No factory registered for ${String(key)}`);
      }
      this.instances.set(key, factory());
    }
    return this.instances.get(key)!;
  }

  async dispose() {
    // Close database connections
    const db = this.instances.get('db');
    if (db) {
      await db.end();
    }

    // Clear all instances
    this.instances.clear();
  }
}

// Export singleton instance
export const container = new DIContainer();