-- Verify Admin User Setup
-- Run this in Supabase SQL Editor to check admin user

-- 1. Check if the user exists in auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'framanreubinstein@gmail.com';

-- 2. Check if the profile exists and has admin role
SELECT 
  p.id,
  p.user_id,
  p.email,
  p.role,
  p.first_name,
  p.last_name,
  p.is_active,
  p.created_at
FROM profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = 'framanreubinstein@gmail.com';

-- 3. If user exists but role is not administrator, update it:
-- UPDATE profiles 
-- SET role = 'administrator', is_active = true
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'framanreubinstein@gmail.com');

-- 4. If user does NOT exist, you need to create them through Supabase Auth:
--    a. Go to Supabase Dashboard > Authentication > Users
--    b. Click "Add User" > "Create New User"
--    c. Enter: framanreubinstein@gmail.com / Framan#001
--    d. Make sure "Auto Confirm User" is checked
--    e. After creation, run the profile insert below:

-- 5. Create profile for new user (replace USER_ID with actual ID from step 4):
-- INSERT INTO profiles (user_id, email, role, first_name, last_name, is_active)
-- VALUES (
--   'USER_ID_HERE', -- Get this from auth.users after creating the user
--   'framanreubinstein@gmail.com',
--   'administrator',
--   'Admin',
--   'User',
--   true
-- );

-- 6. Check all profiles with admin role
SELECT * FROM profiles WHERE role = 'administrator';

-- 7. Ensure email is confirmed in auth.users (if login fails)
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW()
-- WHERE email = 'framanreubinstein@gmail.com' AND email_confirmed_at IS NULL;
