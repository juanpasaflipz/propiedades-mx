-- First, check if users table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'users'
);

-- If the table exists, create or update the admin user
-- This is the correct bcrypt hash for 'admin123' with 10 rounds
INSERT INTO users (
  email, 
  password, 
  name, 
  role, 
  email_verified,
  created_at,
  updated_at
)
VALUES (
  'admin@realestate.mx',
  '$2b$10$F/B3khStv2.U7VanHGVr5OpjydhGrzdQB83Axw8a2UCT0yKaghiXK',
  'Admin User',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  email_verified = EXCLUDED.email_verified,
  updated_at = NOW();

-- Verify the user was created/updated
SELECT 
  id, 
  email, 
  name, 
  role, 
  email_verified,
  created_at,
  updated_at
FROM users
WHERE email = 'admin@realestate.mx';