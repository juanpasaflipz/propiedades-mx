const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  const migrationsDir = path.join(__dirname, '../src/db/migrations');
  
  try {
    // Get all SQL files in the migrations directory
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ensure they run in order
    
    for (const file of files) {
      console.log(`📝 Running migration: ${file}`);
      
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      try {
        await pool.query(sql);
        console.log(`✅ Migration ${file} completed successfully`);
      } catch (error) {
        console.error(`❌ Migration ${file} failed:`, error.message);
        // Continue with other migrations even if one fails
      }
    }
    
    console.log('✨ All migrations completed');
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations().catch(console.error);