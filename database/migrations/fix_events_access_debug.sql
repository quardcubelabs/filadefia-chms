-- Fix events access for debugging
-- This migration ensures events are accessible to authenticated users

-- First, check if RLS is enabled on events table
SELECT 'Checking events table RLS status...' as status;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "events_all_access" ON events;
DROP POLICY IF EXISTS "events_select_all" ON events;
DROP POLICY IF EXISTS "events_modify_staff" ON events;
DROP POLICY IF EXISTS "Everyone can view events" ON events;

-- Ensure RLS is enabled on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create a very permissive policy for debugging
CREATE POLICY "events_debug_all_access" ON events 
  FOR ALL 
  TO public
  USING (true)
  WITH CHECK (true);

-- Fix event_registrations policies as well
DROP POLICY IF EXISTS "event_registrations_all_access" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_select_all" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_insert_authenticated" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_modify_staff" ON event_registrations;

-- Ensure RLS is enabled on event_registrations table
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Create very permissive policy for event_registrations debugging
CREATE POLICY "event_registrations_debug_all_access" ON event_registrations 
  FOR ALL 
  TO public
  USING (true)
  WITH CHECK (true);

-- Alternative: Create more specific policies
-- Uncomment these and comment the above if you want more restrictive access

/*
CREATE POLICY "events_select_authenticated" ON events 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "events_insert_staff" ON events 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'pastor', 'secretary')
    )
  );

CREATE POLICY "events_update_staff" ON events 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'pastor', 'secretary')
    )
  );

CREATE POLICY "events_delete_admin" ON events 
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('administrator', 'pastor')
    )
  );
*/

-- Grant explicit permissions to authenticated role
GRANT ALL ON events TO authenticated;
GRANT ALL ON event_registrations TO authenticated;

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
WHERE tablename IN ('events', 'event_registrations')
ORDER BY tablename, policyname;

-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('events', 'event_registrations');

-- Test basic access after policy creation
SELECT 'Testing events access...' as test;
SELECT count(*) as events_count FROM events;

SELECT 'Testing event_registrations access...' as test;
SELECT count(*) as registrations_count FROM event_registrations;

SELECT 'Events and event_registrations access policies have been reset for debugging' as result;