const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

async function testScrapeDoConnection() {
  console.log('Testing Scrape.do connection...\n');
  
  // Check if token exists
  const token = process.env.SCRAPEDO_TOKEN || process.env.SCRAPEDO_API_KEY;
  if (!token) {
    console.error('❌ SCRAPEDO_TOKEN or SCRAPEDO_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ Scrape.do token found');
  
  // Test API connection
  try {
    const testUrl = 'https://example.com';
    const scrapeDoUrl = `http://api.scrape.do/?token=${token}&url=${encodeURIComponent(testUrl)}`;
    
    console.log('Testing Scrape.do API...');
    const response = await axios.get(scrapeDoUrl, { timeout: 30000 });
    
    if (response.status === 200) {
      console.log('✅ Scrape.do API is accessible');
    } else {
      console.log('⚠️  Scrape.do API returned status:', response.status);
    }
  } catch (error) {
    console.error('❌ Scrape.do API error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
  
  // Check database for scraping history
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Check total properties
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM properties');
    console.log(`\n📊 Total properties in database: ${totalResult.rows[0].total}`);
    
    // Check properties by source
    const sourceResult = await pool.query(`
      SELECT source, COUNT(*) as count 
      FROM properties 
      GROUP BY source 
      ORDER BY count DESC
    `);
    console.log('\n📊 Properties by source:');
    sourceResult.rows.forEach(row => {
      console.log(`   ${row.source || 'unknown'}: ${row.count}`);
    });
    
    // Check latest properties
    const latestResult = await pool.query(`
      SELECT id, source, created_at, city 
      FROM properties 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    console.log('\n📊 Latest properties added:');
    latestResult.rows.forEach(row => {
      console.log(`   ${row.id} - ${row.city} - ${row.created_at} - Source: ${row.source || 'unknown'}`);
    });
    
    // Check unique cities
    const citiesResult = await pool.query(`
      SELECT COUNT(DISTINCT city) as unique_cities,
             COUNT(DISTINCT state_province) as unique_states
      FROM properties
    `);
    console.log(`\n📊 Coverage: ${citiesResult.rows[0].unique_cities} cities, ${citiesResult.rows[0].unique_states} states`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

async function testActualScraping() {
  console.log('\n\nTesting actual scraping...');
  
  const token = process.env.SCRAPEDO_TOKEN || process.env.SCRAPEDO_API_KEY;
  if (!token) {
    console.error('❌ No token found');
    return;
  }
  
  try {
    // Test scraping MercadoLibre CDMX
    const targetUrl = 'https://inmuebles.mercadolibre.com.mx/venta/distrito-federal/';
    const scrapeDoUrl = `http://api.scrape.do/?token=${token}&url=${encodeURIComponent(targetUrl)}&render=true`;
    
    console.log('🔍 Attempting to scrape:', targetUrl);
    const response = await axios.get(scrapeDoUrl, { 
      timeout: 60000,
      maxContentLength: 50 * 1024 * 1024 // 50MB
    });
    
    if (response.status === 200) {
      console.log('✅ Successfully scraped page');
      
      // Check if we got real content
      const html = response.data;
      const propertyCount = (html.match(/ui-search-layout__item/g) || []).length;
      console.log(`📊 Found approximately ${propertyCount} properties on page`);
      
      // Check if pagination info exists
      if (html.includes('ui-search-pagination')) {
        console.log('✅ Pagination found - multiple pages available');
      }
    }
  } catch (error) {
    console.error('❌ Scraping error:', error.message);
  }
}

// Run tests
testScrapeDoConnection()
  .then(() => testActualScraping())
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });