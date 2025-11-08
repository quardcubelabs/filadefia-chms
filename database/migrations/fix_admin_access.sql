-- Fix Admin Access for Members and Departments
-- This script ensures the current user has admin access and sets up proper RLS policies

-- Step 1: Check if your profile exists and update it to administrator role
-- Replace 'your-email@example.com' with your actual login email
UPDATE profiles 
SET role = 'administrator' 
WHERE email = 'your-email@example.com';

-- If no profile exists, we need to create one
-- First, let's see what user_id you have (run this to check):
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Step 2: If profile doesn't exist, create it (replace the UUID with your auth.users id)
-- INSERT INTO profiles (user_id, email, role, first_name, last_name)
-- VALUES (
--   'your-user-id-here',
--   'your-email@example.com',
--   'administrator',
--   'Your First Name',
--   'Your Last Name'
-- )
-- ON CONFLICT (email) DO UPDATE SET role = 'administrator';

-- Step 3: Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view members" ON members;
DROP POLICY IF EXISTS "Staff can manage members" ON members;
DROP POLICY IF EXISTS "Authenticated users can view departments" ON departments;
DROP POLICY IF EXISTS "Staff can manage departments" ON departments;
DROP POLICY IF EXISTS "Admin can manage departments" ON departments;

-- Step 4: Create new admin-only policies for MEMBERS table

-- Allow admins to SELECT members
CREATE POLICY "Admin can view members" ON members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('administrator', 'pastor', 'secretary')
  )
);

-- Allow admins to INSERT members
CREATE POLICY "Admin can insert members" ON members FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('administrator', 'pastor', 'secretary')
  )
);

-- Allow admins to UPDATE members
CREATE POLICY "Admin can update members" ON members FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('administrator', 'pastor', 'secretary')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('administrator', 'pastor', 'secretary')
  )
);

-- Allow admins to DELETE members
CREATE POLICY "Admin can delete members" ON members FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('administrator', 'pastor', 'secretary')
  )
);

-- Step 5: Create new admin-only policies for DEPARTMENTS table

-- Allow admins to SELECT departments
CREATE POLICY "Admin can view departments" ON departments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('administrator', 'pastor', 'secretary', 'department_leader')
  )
);

-- Allow admins to INSERT departments
CREATE POLICY "Admin can insert departments" ON departments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('administrator', 'pastor', 'secretary')
  )
);

-- Allow admins to UPDATE departments
CREATE POLICY "Admin can update departments" ON departments FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('administrator', 'pastor', 'secretary')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('administrator', 'pastor', 'secretary')
  )
);

-- Allow admins to DELETE departments
CREATE POLICY "Admin can delete departments" ON departments FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('administrator', 'pastor', 'secretary')
  )
);

-- Step 6: Verify your profile exists and has admin role
-- Run this query to check:
SELECT 
  p.id,
  p.email,
  p.role,
  p.first_name,
  p.last_name,
  au.id as auth_user_id
FROM profiles p
JOIN auth.users au ON p.user_id = au.id
WHERE p.user_id = auth.uid();

-- If the query above returns nothing, you need to create your profile first!
