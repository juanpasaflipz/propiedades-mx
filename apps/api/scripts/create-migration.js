#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const createMigration = () => {
  const migrationName = process.argv[2];
  
  if (!migrationName) {
    console.error('Please provide a migration name');
    console.error('Usage: npm run migrate:create <migration-name>');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const filename = `${timestamp}_${migrationName}.sql`;
  const migrationsDir = path.join(__dirname, '..', 'src', 'db', 'migrations');
  
  // Ensure migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const filePath = path.join(migrationsDir, filename);
  
  const template = `-- Migration: ${migrationName}
-- Created at: ${new Date().toISOString()}

-- UP Migration
-- Add your migration SQL here

-- Example:
-- CREATE TABLE example (
--   id SERIAL PRIMARY KEY,
--   name VARCHAR(255) NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
`;

  fs.writeFileSync(filePath, template);
  console.log(`Migration created: ${filename}`);
};

createMigration();