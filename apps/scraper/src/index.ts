import * as dotenv from 'dotenv';
import * as cron from 'node-cron';
import { initializeDatabase } from '@aggregator/database';
import { DatabaseConfig } from '@aggregator/types';

// Load environment variables
dotenv.config();

// Import scrapers
import { MercadoLibreScraper } from './scrapers/mercadolibre-scraper';
import { PulppoScraper } from './scrapers/pulppo-scraper';

// Initialize database
const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'real_estate_db',
  ssl: process.env.NODE_ENV === 'production',
};

initializeDatabase(dbConfig);

// Scraping functions
async function runMercadoLibreScraper() {
  console.log('Starting MercadoLibre scraper...');
  try {
    const scraper = new MercadoLibreScraper();
    await scraper.scrape();
    console.log('MercadoLibre scraper completed successfully');
  } catch (error) {
    console.error('MercadoLibre scraper failed:', error);
  }
}

async function runPulppoScraper() {
  console.log('Starting Pulppo scraper...');
  try {
    const scraper = new PulppoScraper();
    await scraper.scrape();
    console.log('Pulppo scraper completed successfully');
  } catch (error) {
    console.error('Pulppo scraper failed:', error);
  }
}

async function runAllScrapers() {
  console.log('Running all scrapers...');
  await Promise.allSettled([
    runMercadoLibreScraper(),
    runPulppoScraper(),
  ]);
  console.log('All scrapers completed');
}

// Schedule scrapers
if (process.env.ENABLE_SCHEDULED_SCRAPING === 'true') {
  // Run MercadoLibre scraper every 6 hours
  cron.schedule('0 */6 * * *', runMercadoLibreScraper);
  
  // Run Pulppo scraper every 8 hours
  cron.schedule('0 */8 * * *', runPulppoScraper);
  
  console.log('Scheduled scraping enabled');
} else {
  console.log('Scheduled scraping disabled');
}

// Handle process signals
process.on('SIGINT', async () => {
  console.log('Shutting down scrapers...');
  process.exit(0);
});

// Export for manual execution
export {
  runMercadoLibreScraper,
  runPulppoScraper,
  runAllScrapers,
};

// Run immediately if called directly
if (require.main === module) {
  const scraper = process.argv[2];
  
  switch (scraper) {
    case 'mercadolibre':
      runMercadoLibreScraper();
      break;
    case 'pulppo':
      runPulppoScraper();
      break;
    case 'all':
      runAllScrapers();
      break;
    default:
      console.log('Usage: npm run dev [mercadolibre|pulppo|all]');
      console.log('Running all scrapers by default...');
      runAllScrapers();
  }
}