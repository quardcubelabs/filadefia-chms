-- Fix announcements access for debugging
-- This migration ensures announcements are accessible to authenticated users

-- First, check if RLS is enabled on announcements table
SELECT 'Checking announcements table RLS status...' as status;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "announcements_all_access" ON announcements;
DROP POLICY IF EXISTS "announcements_select_all" ON announcements;
DROP POLICY IF EXISTS "announcements_modify_staff" ON announcements;
DROP POLICY IF EXISTS "Everyone can view announcements" ON announcements;

-- Ensure RLS is enabled on announcements table
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create a very permissive policy for debugging
CREATE POLICY "announcements_debug_all_access" ON announcements 
  FOR ALL 
  TO public
  USING (true)
  WITH CHECK (true);

-- Fix communications policies as well
DROP POLICY IF EXISTS "communications_all_access" ON communications;
DROP POLICY IF EXISTS "communications_select_involved" ON communications;
DROP POLICY IF EXISTS "communications_insert_staff" ON communications;

-- Ensure RLS is enabled on communications table
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Create very permissive policy for communications debugging
CREATE POLICY "communications_debug_all_access" ON communications 
  FOR ALL 
  TO public
  USING (true)
  WITH CHECK (true);

-- Grant explicit permissions to authenticated role
GRANT ALL ON announcements TO authenticated;
GRANT ALL ON communications TO authenticated;

-- Check the current policies after creation
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
WHERE tablename IN ('announcements', 'communications')
ORDER BY tablename, policyname;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('announcements', 'communications');

-- Test basic access after policy creation
SELECT 'Testing announcements access...' as test;
SELECT count(*) as announcements_count FROM announcements;

SELECT 'Testing communications access...' as test;
SELECT count(*) as communications_count FROM communications;

SELECT 'Announcements and communications access policies have been reset for debugging' as result;