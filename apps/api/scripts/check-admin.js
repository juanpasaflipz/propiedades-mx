const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the api directory
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkAdminUser() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Checking for admin user...');

    // Check if admin exists
    const result = await pool.query(
      'SELECT id, email, password, role FROM users WHERE email = $1',
      ['admin@realestate.mx']
    );

    if (result.rows.length > 0) {
      const admin = result.rows[0];
      console.log('✅ Admin user found:', {
        id: admin.id,
        email: admin.email,
        role: admin.role
      });

      // Test password
      const isValid = await bcrypt.compare('admin123', admin.password);
      console.log('Password "admin123" is valid:', isValid);

      if (!isValid) {
        console.log('\n⚠️  Password mismatch! Updating password to "admin123"...');
        
        const newHash = await bcrypt.hash('admin123', 10);
        await pool.query(
          'UPDATE users SET password = $1 WHERE email = $2',
          [newHash, 'admin@realestate.mx']
        );
        
        console.log('✅ Password updated successfully!');
      }
    } else {
      console.log('❌ Admin user not found. Creating admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (email, password, name, role, email_verified) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)',
        ['admin@realestate.mx', hashedPassword, 'Admin User', 'admin']
      );
      
      console.log('✅ Admin user created successfully!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run check
checkAdminUser();