require('dotenv').config();
const { Pool } = require('pg');

async function fixPropertyData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Check data issues
    console.log('=== Checking Property Data Issues ===\n');

    // 1. Check properties with $0 price
    const zeroPriceCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM properties 
      WHERE price_amount = 0 OR price_amount IS NULL
    `);
    console.log(`Properties with $0 price: ${zeroPriceCount.rows[0].count}`);

    // 2. Check properties with missing listing URLs
    const missingUrlCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM properties 
      WHERE (listing_url IS NULL OR listing_url = '' OR listing_url = '#') 
      AND (contact_info IS NULL OR contact_info = '' OR contact_info = '#')
    `);
    console.log(`Properties with missing URLs: ${missingUrlCount.rows[0].count}`);

    // 3. Sample properties with issues
    const sampleIssues = await pool.query(`
      SELECT id, source, price_amount, city, address, contact_info, listing_url
      FROM properties 
      WHERE price_amount = 0 OR price_amount IS NULL
      LIMIT 5
    `);
    
    if (sampleIssues.rows.length > 0) {
      console.log('\n=== Sample Properties with $0 Price ===');
      sampleIssues.rows.forEach(row => {
        console.log(`ID: ${row.id}`);
        console.log(`  Source: ${row.source}`);
        console.log(`  Price: ${row.price_amount}`);
        console.log(`  Location: ${row.city}`);
        console.log(`  Address: ${row.address}`);
        console.log('');
      });
    }

    // 4. Fix data issues
    console.log('\n=== Fixing Data Issues ===\n');

    // Update properties where contact_info contains a URL but listing_url is empty
    const updateUrlResult = await pool.query(`
      UPDATE properties 
      SET listing_url = contact_info 
      WHERE (listing_url IS NULL OR listing_url = '' OR listing_url = '#')
      AND contact_info LIKE 'http%'
    `);
    console.log(`Updated ${updateUrlResult.rowCount} properties with URLs from contact_info`);

    // Set placeholder URLs for properties without any URL
    const placeholderResult = await pool.query(`
      UPDATE properties 
      SET listing_url = 'https://www.mercadolibre.com.mx/inmuebles'
      WHERE (listing_url IS NULL OR listing_url = '' OR listing_url = '#')
      AND (contact_info IS NULL OR contact_info = '' OR contact_info = '#')
      AND source = 'mercadolibre'
    `);
    console.log(`Set placeholder URLs for ${placeholderResult.rowCount} MercadoLibre properties`);

    // Remove properties with $0 price (likely bad data)
    const deleteResult = await pool.query(`
      DELETE FROM properties 
      WHERE price_amount = 0 OR price_amount IS NULL
    `);
    console.log(`Removed ${deleteResult.rowCount} properties with $0 price`);

    // 5. Final stats
    console.log('\n=== Final Statistics ===');
    const finalStats = await pool.query(`
      SELECT 
        COUNT(*) as total_properties,
        COUNT(CASE WHEN price_amount > 0 THEN 1 END) as valid_price_count,
        COUNT(CASE WHEN listing_url IS NOT NULL AND listing_url != '' AND listing_url != '#' THEN 1 END) as valid_url_count,
        AVG(CASE WHEN price_amount > 0 THEN price_amount END) as avg_price,
        MIN(CASE WHEN price_amount > 0 THEN price_amount END) as min_price,
        MAX(price_amount) as max_price
      FROM properties
    `);
    
    const stats = finalStats.rows[0];
    console.log(`Total properties: ${stats.total_properties}`);
    console.log(`Properties with valid price: ${stats.valid_price_count}`);
    console.log(`Properties with valid URL: ${stats.valid_url_count}`);
    console.log(`Average price: $${parseFloat(stats.avg_price).toLocaleString()} MXN`);
    console.log(`Price range: $${parseFloat(stats.min_price).toLocaleString()} - $${parseFloat(stats.max_price).toLocaleString()} MXN`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixPropertyData();