import { MercadoLibreScraper } from './scrapers/mercadolibre-scraper';
import { PulppoScraper } from './scrapers/pulppo-scraper';
import { ScrapedoScraper } from './scrapers/scrapedo-scraper';
import { Pool } from 'pg';

interface ScraperStatus {
  name: string;
  lastRun: Date | null;
  status: 'idle' | 'running' | 'failed';
  totalScraped: number;
  errors: string[];
}

export class ScraperOrchestrator {
  private scrapers: Map<string, any> = new Map();
  private status: Map<string, ScraperStatus> = new Map();
  private pool: Pool;
  private isRunning = false;

  constructor() {
    // Initialize scrapers
    this.scrapers.set('mercadolibre', MercadoLibreScraper);
    this.scrapers.set('pulppo', PulppoScraper);
    this.scrapers.set('scrapedo', ScrapedoScraper);

    // Initialize status
    this.scrapers.forEach((_, name) => {
      this.status.set(name, {
        name,
        lastRun: null,
        status: 'idle',
        totalScraped: 0,
        errors: []
      });
    });

    // Initialize database
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }

  async runAll(parallel: boolean = false): Promise<void> {
    if (this.isRunning) {
      console.log('Scraping already in progress');
      return;
    }

    this.isRunning = true;
    console.log(`Starting scraping orchestration (${parallel ? 'parallel' : 'sequential'})...`);

    try {
      if (parallel) {
        await this.runParallel();
      } else {
        await this.runSequential();
      }
    } finally {
      this.isRunning = false;
      await this.saveStatus();
    }
  }

  private async runSequential(): Promise<void> {
    for (const [name, ScraperClass] of this.scrapers) {
      await this.runScraper(name, ScraperClass);
    }
  }

  private async runParallel(): Promise<void> {
    const promises = Array.from(this.scrapers.entries()).map(([name, ScraperClass]) => 
      this.runScraper(name, ScraperClass)
    );
    
    await Promise.allSettled(promises);
  }

  private async runScraper(name: string, ScraperClass: any): Promise<void> {
    const status = this.status.get(name)!;
    status.status = 'running';
    status.errors = [];

    console.log(`Starting ${name} scraper...`);

    try {
      const scraper = new ScraperClass();
      const result = await scraper.scrape();
      
      status.status = result.success ? 'idle' : 'failed';
      status.lastRun = new Date();
      status.totalScraped += result.totalScraped;
      status.errors = result.errors;

      console.log(`${name} scraper finished: ${result.totalScraped} properties scraped`);
    } catch (error) {
      status.status = 'failed';
      status.errors.push(error.message);
      console.error(`${name} scraper failed:`, error);
    }
  }

  async runSpecific(scraperName: string): Promise<void> {
    const ScraperClass = this.scrapers.get(scraperName);
    if (!ScraperClass) {
      throw new Error(`Unknown scraper: ${scraperName}`);
    }

    if (this.isRunning) {
      console.log('Scraping already in progress');
      return;
    }

    this.isRunning = true;
    try {
      await this.runScraper(scraperName, ScraperClass);
    } finally {
      this.isRunning = false;
      await this.saveStatus();
    }
  }

  getStatus(): ScraperStatus[] {
    return Array.from(this.status.values());
  }

  private async saveStatus(): Promise<void> {
    try {
      for (const status of this.status.values()) {
        await this.pool.query(
          `INSERT INTO scraper_status (name, last_run, status, total_scraped, errors)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (name) DO UPDATE SET
             last_run = EXCLUDED.last_run,
             status = EXCLUDED.status,
             total_scraped = EXCLUDED.total_scraped,
             errors = EXCLUDED.errors`,
          [
            status.name,
            status.lastRun,
            status.status,
            status.totalScraped,
            JSON.stringify(status.errors)
          ]
        );
      }
    } catch (error) {
      console.error('Failed to save scraper status:', error);
    }
  }

  async cleanup(): Promise<void> {
    await this.pool.end();
  }
}