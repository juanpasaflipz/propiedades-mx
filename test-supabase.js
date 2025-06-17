const { Client } = require('pg');

const testConnection = async () => {
  const client = new Client({
    connectionString: 'postgresql://postgres:rnj@vmc@QER8xnz1vpq@db.pfpyfxspinghdhrjalsg.supabase.co:5432/postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Attempting to connect to Supabase...');
    await client.connect();
    console.log('✅ Successfully connected to Supabase!');
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // Check for existing tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\nExisting tables:', tables.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await client.end();
  }
};

testConnection();