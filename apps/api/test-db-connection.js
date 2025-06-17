const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.error('No DATABASE_URL found in environment');
    return;
  }

  // Try different connection methods
  const methods = [
    {
      name: 'Direct connection string',
      config: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Parsed URL with explicit port 5432',
      config: () => {
        const url = new URL(process.env.DATABASE_URL);
        return {
          user: decodeURIComponent(url.username),
          password: decodeURIComponent(url.password),
          host: url.hostname,
          port: 5432, // Force port 5432
          database: url.pathname.slice(1),
          ssl: { rejectUnauthorized: false }
        };
      }
    },
    {
      name: 'Direct Supabase config',
      config: {
        user: 'postgres',
        password: 'rnj@vmc@QER8xnz1vpq',
        host: 'db.pfpyfxspinghdhrjalsg.supabase.co',
        port: 5432,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
      }
    }
  ];

  for (const method of methods) {
    console.log(`\nTrying ${method.name}...`);
    const config = typeof method.config === 'function' ? method.config() : method.config;
    const pool = new Pool(config);
    
    try {
      const client = await pool.connect();
      console.log(`✅ ${method.name} - Connected successfully!`);
      
      const result = await client.query('SELECT COUNT(*) FROM properties');
      console.log(`Properties count: ${result.rows[0].count}`);
      
      client.release();
      await pool.end();
    } catch (err) {
      console.error(`❌ ${method.name} - Failed:`, err.message);
      await pool.end();
    }
  }
}

testConnection();