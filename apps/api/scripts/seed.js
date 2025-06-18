const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function seedDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Starting database seed...');

    // Check if admin user should be created
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      // Check if admin already exists
      const existingAdmin = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [process.env.ADMIN_EMAIL]
      );

      if (existingAdmin.rows.length === 0) {
        // Hash password
        const hashedPassword = await bcrypt.hash(
          process.env.ADMIN_PASSWORD, 
          parseInt(process.env.BCRYPT_ROUNDS || '12')
        );

        // Create admin user
        await pool.query(
          'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
          [process.env.ADMIN_EMAIL, hashedPassword, 'Admin', 'admin']
        );

        console.log('✅ Admin user created:', process.env.ADMIN_EMAIL);
      } else {
        console.log('ℹ️  Admin user already exists:', process.env.ADMIN_EMAIL);
      }
    } else {
      console.log('⚠️  No ADMIN_EMAIL or ADMIN_PASSWORD provided, skipping admin creation');
    }

    console.log('✅ Database seed completed');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seed
seedDatabase();