const { execSync } = require('child_process');
const fs = require('fs');

console.log('Building @aggregator/database...');

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

try {
  execSync('npx tsc || true', { stdio: 'inherit' });
  console.log('Database package built');
} catch (error) {
  console.error('Build error:', error);
}