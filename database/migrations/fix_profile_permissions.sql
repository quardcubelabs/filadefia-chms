-- Alternative Storage Fix - Works without storage.objects table access
-- This approach focuses on profile table permissions and uses service role bypass

-- First, let's ensure the profiles table has proper update permissions
-- Drop and recreate profile policies to be more permissive

-- Drop existing profile policies that might be too restrictive
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "authenticated_can_update_profiles" ON profiles;
DROP POLICY IF EXISTS "staff_can_update_profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create a comprehensive profile update policy
CREATE POLICY "profiles_comprehensive_update" ON profiles 
  FOR UPDATE TO authenticated 
  USING (
    -- Allow users to update their own profile
    user_id = auth.uid() 
    OR 
    -- Allow all authenticated staff roles to update profiles
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'pastor', 'secretary', 'treasurer', 'department_leader')
      AND p.is_active = true
    )
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'pastor', 'secretary', 'treasurer', 'department_leader')
      AND p.is_active = true
    )
  );

-- Also ensure INSERT permissions for profiles (in case needed)
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert_authenticated" ON profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- Show current profile policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public'
ORDER BY policyname;

SELECT 'Profile RLS policies updated successfully!' as result;
SELECT 'Note: Storage bucket policies must be set via Supabase Dashboard' as storage_note;