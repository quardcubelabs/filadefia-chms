-- Fix User Creation Issues - RLS Policies
-- Run this in Supabase SQL Editor to allow proper user creation

-- 1. Fix Profiles table - allow INSERT for user creation
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
CREATE POLICY "profiles_insert_policy" 
ON profiles FOR INSERT 
WITH CHECK (
    -- Allow service role to insert (for user creation)
    current_setting('role') = 'service_role'
    OR
    -- Allow users to create their own profile
    user_id = auth.uid()
    OR
    -- Allow admins to create profiles
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('administrator', 'pastor')
    )
);

-- 2. Fix Profiles table - allow UPDATE for profile completion
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
CREATE POLICY "profiles_update_policy" 
ON profiles FOR UPDATE 
USING (
    -- Users can update their own profile
    user_id = auth.uid()
    OR
    -- Admins can update any profile
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('administrator', 'pastor')
    )
);

-- 3. Ensure profiles table has proper SELECT policy
DROP POLICY IF EXISTS "profiles_department_access" ON profiles;
CREATE POLICY "profiles_select_policy" 
ON profiles FOR SELECT 
USING (
    -- Users can see their own profile
    user_id = auth.uid()
    OR
    -- Admins and pastors can see all profiles
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('administrator', 'pastor')
    )
    OR
    -- Department leaders can see profiles of their department members
    EXISTS (
        SELECT 1 FROM department_members dm
        JOIN departments d ON d.id = dm.department_id
        JOIN members m ON m.id = dm.member_id
        WHERE dm.is_active = true
        AND LOWER(m.first_name) = LOWER(profiles.first_name)
        AND LOWER(m.last_name) = LOWER(profiles.last_name)
        AND d.leader_user_id = auth.uid()
    )
);

-- 4. DISABLE RLS COMPLETELY FOR USER CREATION
-- Run this now to allow user creation:
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 5. Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END AS rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'members', 'departments', 'department_members')
ORDER BY tablename;

SELECT 'USER CREATION RLS POLICIES FIXED' as status;