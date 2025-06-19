# Fix Authentication Issue

## Quick Fix in Supabase

1. Go to Supabase SQL Editor
2. Run this SQL:

```sql
-- Fix or create admin user with correct password
INSERT INTO users (email, password, name, role, email_verified)
VALUES (
  'admin@realestate.mx',
  '$2b$10$F/B3khStv2.U7VanHGVr5OpjydhGrzdQB83Axw8a2UCT0yKaghiXK',
  'Admin User',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE
SET password = EXCLUDED.password;

-- Verify it worked
SELECT email, name, role FROM users WHERE email = 'admin@realestate.mx';
```

## Test Login

After running the SQL, test login:

1. Go to: https://propiedades-mx-web.vercel.app/auth/signin
2. Use credentials:
   - Email: `admin@realestate.mx`
   - Password: `admin123`

## What Was Wrong?

1. The password hash in the database was incorrect
2. The frontend was expecting different token field names

Both issues have been fixed in the code and pushed to GitHub.