import * as dotenv from 'dotenv';
import * as cron from 'node-cron';
import { initializeDatabase } from '@aggregator/database';
import { DatabaseConfig } from '@aggregator/types';

// Load environment variables
dotenv.config();

// Import scrapers
import { ScrapeDoScraper } from './scrapers/scrapedo-scraper';

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
async function runScrapeDoScraper() {
  console.log('Starting Scrape.do scraper...');
  try {
    const scraper = new ScrapeDoScraper();
    
    // Test connection first
    const connected = await scraper.testConnection();
    if (!connected) {
      console.error('Failed to connect to Scrape.do API. Please check your API key.');
      return;
    }
    
    await scraper.scrape();
    console.log('Scrape.do scraper completed successfully');
  } catch (error) {
    console.error('Scrape.do scraper failed:', error);
  }
}

async function runAllScrapers() {
  console.log('Running Scrape.do scraper...');
  await runScrapeDoScraper();
  console.log('Scraper completed');
}

// Schedule scrapers
if (process.env.ENABLE_SCHEDULED_SCRAPING === 'true') {
  // Run Scrape.do scraper every 4 hours
  cron.schedule('0 */4 * * *', runScrapeDoScraper);
  
  console.log('Scheduled scraping enabled - running every 4 hours');
  
  // Also run immediately on startup
  runScrapeDoScraper();
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
  runScrapeDoScraper,
  runAllScrapers,
};

// Run immediately if called directly
if (require.main === module) {
  const scraper = process.argv[2];
  
  switch (scraper) {
    case 'scrapedo':
      runScrapeDoScraper();
      break;
    case 'test':
      // Just test the connection
      const testScraper = new ScrapeDoScraper();
      testScraper.testConnection();
      break;
    case 'all':
      runAllScrapers();
      break;
    default:
      console.log('Usage: npm run dev [scrapedo|test|all]');
      console.log('Running Scrape.do scraper by default...');
      runScrapeDoScraper();
  }
}