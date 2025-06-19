-- Check if admin user exists
SELECT id, email, name, role, email_verified, created_at
FROM users
WHERE email = 'admin@realestate.mx';

-- Check total users
SELECT COUNT(*) as total_users FROM users;

-- List all users (without passwords)
SELECT id, email, name, role, email_verified, created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;