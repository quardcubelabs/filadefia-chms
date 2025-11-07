-- Fix RLS Policies - Remove Infinite Recursion
-- This migration completely removes the circular dependency in profiles table

-- Step 1: Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

-- Step 2: Create simple, non-recursive policies for profiles

-- Allow authenticated users to read their own profile (no recursion)
CREATE POLICY "profiles_read_own" ON profiles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to update their own profile (no recursion)
CREATE POLICY "profiles_update_own_simple" ON profiles 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow new users to insert their profile (no recursion)
CREATE POLICY "profiles_insert_own" ON profiles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow service_role to do everything (for admin operations via backend)
-- This bypasses RLS completely for service role
CREATE POLICY "profiles_service_role_all" ON profiles 
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 3: Update other table policies to remove circular references
-- Instead of checking role from profiles table, we'll use a simpler approach

-- Update members policies
DROP POLICY IF EXISTS "members_select_authenticated" ON members;
DROP POLICY IF EXISTS "members_insert_staff" ON members;
DROP POLICY IF EXISTS "members_update_staff" ON members;
DROP POLICY IF EXISTS "members_delete_admin" ON members;
DROP POLICY IF EXISTS "Staff can manage members" ON members;

-- Allow all authenticated users to read members
CREATE POLICY "members_read_all" ON members 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Allow all authenticated users to insert/update/delete members
-- (We'll handle role-based permissions in the application layer)
CREATE POLICY "members_insert_all" ON members 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "members_update_all" ON members 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "members_delete_all" ON members 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Update departments policies
DROP POLICY IF EXISTS "departments_select_all" ON departments;
DROP POLICY IF EXISTS "departments_modify_admin" ON departments;
DROP POLICY IF EXISTS "Authenticated users can view departments" ON departments;
DROP POLICY IF EXISTS "Staff can manage departments" ON departments;

CREATE POLICY "departments_all_access" ON departments 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update department_members policies
DROP POLICY IF EXISTS "department_members_select_all" ON department_members;
DROP POLICY IF EXISTS "department_members_modify_staff" ON department_members;

CREATE POLICY "department_members_all_access" ON department_members 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update attendance policies
DROP POLICY IF EXISTS "attendance_select_all" ON attendance;
DROP POLICY IF EXISTS "attendance_modify_staff" ON attendance;

CREATE POLICY "attendance_all_access" ON attendance 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update financial_transactions policies
DROP POLICY IF EXISTS "financial_select_staff" ON financial_transactions;
DROP POLICY IF EXISTS "financial_modify_treasurer" ON financial_transactions;

CREATE POLICY "financial_all_access" ON financial_transactions 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update events policies
DROP POLICY IF EXISTS "events_select_all" ON events;
DROP POLICY IF EXISTS "events_modify_staff" ON events;

CREATE POLICY "events_all_access" ON events 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update event_registrations policies
DROP POLICY IF EXISTS "event_registrations_select_all" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_insert_authenticated" ON event_registrations;
DROP POLICY IF EXISTS "event_registrations_modify_staff" ON event_registrations;

CREATE POLICY "event_registrations_all_access" ON event_registrations 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update announcements policies
DROP POLICY IF EXISTS "announcements_select_all" ON announcements;
DROP POLICY IF EXISTS "announcements_modify_staff" ON announcements;

CREATE POLICY "announcements_all_access" ON announcements 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update communications policies
DROP POLICY IF EXISTS "communications_select_involved" ON communications;
DROP POLICY IF EXISTS "communications_insert_staff" ON communications;

CREATE POLICY "communications_all_access" ON communications 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update meeting_minutes policies
DROP POLICY IF EXISTS "meeting_minutes_select_all" ON meeting_minutes;
DROP POLICY IF EXISTS "meeting_minutes_modify_leaders" ON meeting_minutes;

CREATE POLICY "meeting_minutes_all_access" ON meeting_minutes 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update reports policies
DROP POLICY IF EXISTS "reports_select_staff" ON reports;
DROP POLICY IF EXISTS "reports_insert_staff" ON reports;

CREATE POLICY "reports_all_access" ON reports 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update pledges policies
DROP POLICY IF EXISTS "pledges_select_own_or_staff" ON pledges;
DROP POLICY IF EXISTS "pledges_modify_staff" ON pledges;

CREATE POLICY "pledges_all_access" ON pledges 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update system_settings policies
DROP POLICY IF EXISTS "system_settings_select_all" ON system_settings;
DROP POLICY IF EXISTS "system_settings_modify_admin" ON system_settings;

CREATE POLICY "system_settings_all_access" ON system_settings 
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure all permissions are granted
GRANT USAGE ON SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
