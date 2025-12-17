-- EMERGENCY FIX: Temporarily disable RLS for user creation
-- Run this to allow user creation, then we'll re-enable with proper policies

-- 1. Temporarily disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Check if there's a user creation trigger that might be failing
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles' 
   OR trigger_name LIKE '%user%' 
   OR trigger_name LIKE '%profile%';

-- 3. Create the user now (go back to Supabase dashboard and try creating the user)

-- 4. After user creation works, run this to re-enable RLS with proper policies:
/*
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for user management
DROP POLICY IF EXISTS "profiles_full_access" ON profiles;
CREATE POLICY "profiles_full_access" 
ON profiles FOR ALL 
USING (
    -- Always allow if no auth context (for triggers/service operations)
    auth.uid() IS NULL
    OR
    -- Users can manage their own profile  
    user_id = auth.uid()
    OR
    -- Admins can manage all profiles
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('administrator', 'pastor')
    )
    OR
    -- Department leaders can view their department members' profiles
    EXISTS (
        SELECT 1 FROM department_members dm
        JOIN departments d ON d.id = dm.department_id  
        JOIN members m ON m.id = dm.member_id
        WHERE dm.is_active = true
        AND LOWER(m.first_name) = LOWER(profiles.first_name)
        AND LOWER(m.last_name) = LOWER(profiles.last_name)  
        AND d.leader_user_id = auth.uid()
    )
)
WITH CHECK (
    -- Same conditions for INSERT/UPDATE
    auth.uid() IS NULL
    OR
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('administrator', 'pastor')
    )
);
*/

SELECT 'RLS TEMPORARILY DISABLED FOR USER CREATION - CREATE USERS NOW' as status;