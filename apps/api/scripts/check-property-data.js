require('dotenv').config();
const { Pool } = require('pg');

async function checkPropertyData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Check sample properties
    const result = await pool.query(`
      SELECT 
        id, 
        source, 
        price_amount, 
        price_currency,
        city, 
        address, 
        contact_info,
        created_at
      FROM properties 
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('=== Sample Properties ===');
    console.log(`Total found: ${result.rows.length}`);
    console.log('');

    result.rows.forEach((row, index) => {
      console.log(`Property ${index + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Source: ${row.source}`);
      console.log(`  Price: ${row.price_currency} ${row.price_amount}`);
      console.log(`  City: ${row.city}`);
      console.log(`  Address: ${row.address}`);
      console.log(`  Contact Info: ${row.contact_info}`);
      console.log(`  Created: ${row.created_at}`);
      console.log('');
    });

    // Check for zero prices
    const zeroCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM properties 
      WHERE price_amount = 0 OR price_amount IS NULL
    `);
    
    console.log(`Properties with $0 price: ${zeroCount.rows[0].count}`);

    // Check for missing contact_info
    const missingContact = await pool.query(`
      SELECT COUNT(*) as count 
      FROM properties 
      WHERE contact_info IS NULL OR contact_info = ''
    `);
    
    console.log(`Properties with missing contact info: ${missingContact.rows[0].count}`);

    // Check unique sources
    const sources = await pool.query(`
      SELECT source, COUNT(*) as count 
      FROM properties 
      GROUP BY source
      ORDER BY count DESC
    `);
    
    console.log('\n=== Properties by Source ===');
    sources.rows.forEach(row => {
      console.log(`  ${row.source}: ${row.count}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPropertyData();