-- Fix admin password to match 'admin123'
-- This hash is for 'admin123' with bcrypt rounds=10
UPDATE users 
SET password = '$2b$10$F/B3khStv2.U7VanHGVr5OpjydhGrzdQB83Axw8a2UCT0yKaghiXK'
WHERE email = 'admin@realestate.mx';

-- Verify the update
SELECT id, email, name, role, email_verified 
FROM users 
WHERE email = 'admin@realestate.mx';