import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({
  path: '.env.test',
});

// Set default test environment variables if not present
process.env.DB_NAME = process.env.DB_NAME || 'real_estate_test_db';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.PORT = process.env.PORT || '3001'; 