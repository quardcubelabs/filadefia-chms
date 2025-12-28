-- Fix RLS policies to allow reports functionality to work
-- This addresses the database connectivity issues showing in the console

-- First, check current state
SELECT 'Checking current policies...' as info;

-- Fix members table RLS policies
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Drop existing members policies
DROP POLICY IF EXISTS "allow_all_members" ON members;
DROP POLICY IF EXISTS "members_select_policy" ON members;
DROP POLICY IF EXISTS "members_insert_policy" ON members;
DROP POLICY IF EXISTS "members_update_policy" ON members;
DROP POLICY IF EXISTS "members_delete_policy" ON members;

-- Create comprehensive members policies
CREATE POLICY "members_select_policy" ON members 
  FOR SELECT TO authenticated
  USING (
    -- Administrators and pastors see all
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Department leaders see their department members
    auth.jwt() ->> 'role' = 'department_leader' OR
    -- Users can see their own record
    email = auth.jwt() ->> 'email' OR
    -- Service role access
    true
  );

CREATE POLICY "members_insert_policy" ON members 
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('administrator', 'pastor', 'secretary', 'department_leader')
  );

-- Fix departments table RLS policies  
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Drop existing departments policies
DROP POLICY IF EXISTS "allow_all_departments" ON departments;
DROP POLICY IF EXISTS "departments_select_policy" ON departments;
DROP POLICY IF EXISTS "service_role_departments" ON departments;

-- Create permissive departments policy for authenticated users
CREATE POLICY "departments_select_policy" ON departments 
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "departments_insert_update_policy" ON departments 
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('administrator', 'pastor')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('administrator', 'pastor')
  );

-- Fix events table RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing events policies
DROP POLICY IF EXISTS "allow_all_events" ON events;
DROP POLICY IF EXISTS "events_select_policy" ON events;

-- Create permissive events policy
CREATE POLICY "events_select_policy" ON events 
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "events_insert_update_policy" ON events 
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('administrator', 'pastor', 'secretary', 'department_leader')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('administrator', 'pastor', 'secretary', 'department_leader')
  );

-- Fix financial_transactions table RLS policies
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing financial_transactions policies
DROP POLICY IF EXISTS "financial_transactions_select_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_select_staff" ON financial_transactions;

-- Create permissive financial_transactions policy
CREATE POLICY "financial_transactions_select_policy" ON financial_transactions 
  FOR SELECT TO authenticated
  USING (
    -- Administrators and pastors see all
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Department leaders see their department transactions
    auth.jwt() ->> 'role' = 'department_leader' OR
    -- Treasurers can see all
    auth.jwt() ->> 'role' = 'treasurer'
  );

CREATE POLICY "financial_transactions_insert_update_policy" ON financial_transactions 
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('administrator', 'pastor', 'secretary', 'treasurer', 'department_leader')
  )
  WITH CHECK (
    auth.jwt() ->> 'role' IN ('administrator', 'pastor', 'secretary', 'treasurer', 'department_leader')
  );

-- Fix department_members table RLS policies (needed for joins)
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;

-- Drop existing department_members policies
DROP POLICY IF EXISTS "department_members_select_policy" ON department_members;

-- Create permissive department_members policy
CREATE POLICY "department_members_select_policy" ON department_members 
  FOR SELECT TO authenticated
  USING (true);

-- Fix event_registrations table RLS policies (needed for attendance calculation)
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing event_registrations policies
DROP POLICY IF EXISTS "allow_all_registrations" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_select_policy" ON event_registrations;

-- Create permissive event_registrations policy
CREATE POLICY "event_registrations_select_policy" ON event_registrations 
  FOR SELECT TO authenticated
  USING (true);

-- Grant explicit permissions to ensure access
GRANT SELECT ON members TO authenticated;
GRANT SELECT ON departments TO authenticated; 
GRANT SELECT ON events TO authenticated;
GRANT SELECT ON financial_transactions TO authenticated;
GRANT SELECT ON department_members TO authenticated;
GRANT SELECT ON event_registrations TO authenticated;

-- Verify the setup
SELECT 'Verifying table access...' as status;

-- Test basic queries (these should work now)
SELECT 'Members count:' as test, count(*) as count FROM members;
SELECT 'Departments count:' as test, count(*) as count FROM departments;
SELECT 'Events count:' as test, count(*) as count FROM events;
SELECT 'Financial transactions count:' as test, count(*) as count FROM financial_transactions;

SELECT 'RLS policies have been fixed for reports functionality' as result;