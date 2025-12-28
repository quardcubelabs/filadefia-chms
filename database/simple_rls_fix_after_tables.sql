-- Simple RLS fix after ensuring tables exist
-- Run this AFTER running check_and_create_tables.sql

-- Disable RLS temporarily to avoid conflicts, then re-enable with proper policies

-- Members table RLS
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "members_select_policy" ON members;
DROP POLICY IF EXISTS "allow_all_members" ON members;

-- Create simple select policy for members
CREATE POLICY "members_select_policy" ON members 
  FOR SELECT TO authenticated
  USING (true);

-- Departments table RLS  
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "departments_select_policy" ON departments;
DROP POLICY IF EXISTS "allow_all_departments" ON departments;
DROP POLICY IF EXISTS "service_role_departments" ON departments;

-- Create simple select policy for departments
CREATE POLICY "departments_select_policy" ON departments 
  FOR SELECT TO authenticated
  USING (true);

-- Department members table RLS
ALTER TABLE department_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "department_members_select_policy" ON department_members;

-- Create simple select policy for department_members
CREATE POLICY "department_members_select_policy" ON department_members 
  FOR SELECT TO authenticated
  USING (true);

-- Events table RLS
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "allow_all_events" ON events;

-- Create simple select policy for events
CREATE POLICY "events_select_policy" ON events 
  FOR SELECT TO authenticated
  USING (true);

-- Event registrations table RLS
ALTER TABLE event_registrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "event_registrations_select_policy" ON event_registrations;
DROP POLICY IF EXISTS "allow_all_registrations" ON event_registrations;

-- Create simple select policy for event_registrations
CREATE POLICY "event_registrations_select_policy" ON event_registrations 
  FOR SELECT TO authenticated
  USING (true);

-- Financial transactions table RLS
ALTER TABLE financial_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "financial_transactions_select_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_select_staff" ON financial_transactions;

-- Create simple select policy for financial_transactions
CREATE POLICY "financial_transactions_select_policy" ON financial_transactions 
  FOR SELECT TO authenticated
  USING (true);

-- Announcements table RLS
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "announcements_select_policy" ON announcements;
DROP POLICY IF EXISTS "announcements_select_all" ON announcements;
DROP POLICY IF EXISTS "announcements_all_access" ON announcements;

-- Create simple select policy for announcements
CREATE POLICY "announcements_select_policy" ON announcements 
  FOR SELECT TO authenticated
  USING (true);

-- Grant permissions explicitly
GRANT SELECT ON members TO authenticated, anon;
GRANT SELECT ON departments TO authenticated, anon;
GRANT SELECT ON department_members TO authenticated, anon;
GRANT SELECT ON events TO authenticated, anon;
GRANT SELECT ON event_registrations TO authenticated, anon;
GRANT SELECT ON financial_transactions TO authenticated, anon;
GRANT SELECT ON announcements TO authenticated, anon;

-- Test the setup
SELECT 'Testing table access after RLS fix:' as test;

SELECT 'Members:' as table_name, count(*) as count FROM members
UNION ALL
SELECT 'Departments:', count(*) FROM departments  
UNION ALL
SELECT 'Events:', count(*) FROM events
UNION ALL
SELECT 'Financial:', count(*) FROM financial_transactions
UNION ALL
SELECT 'Announcements:', count(*) FROM announcements;

SELECT 'RLS policies fixed - tables should now be accessible' as result;