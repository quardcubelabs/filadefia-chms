-- Fix RLS Policies to prevent infinite recursion
-- This migration fixes the circular dependency in RLS policies

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff can manage members" ON members;

-- Recreate profiles policies without recursion
-- Allow users to read their own profile directly
CREATE POLICY "profiles_select_own" ON profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own" ON profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow service role and authenticated users to insert profiles
CREATE POLICY "profiles_insert" ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Simple policy for administrators - no circular reference
CREATE POLICY "profiles_admin_all" ON profiles 
  FOR ALL 
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor')
  );

-- Fix members policies
CREATE POLICY "members_select_authenticated" ON members 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "members_insert_staff" ON members 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'secretary')
  );

CREATE POLICY "members_update_staff" ON members 
  FOR UPDATE 
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'secretary')
  );

CREATE POLICY "members_delete_admin" ON members 
  FOR DELETE 
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor')
  );

-- Fix departments policies
DROP POLICY IF EXISTS "Authenticated users can view departments" ON departments;
DROP POLICY IF EXISTS "Staff can manage departments" ON departments;

CREATE POLICY "departments_select_all" ON departments 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "departments_modify_admin" ON departments 
  FOR ALL 
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor')
  );

-- Fix department_members policies
CREATE POLICY "department_members_select_all" ON department_members 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "department_members_modify_staff" ON department_members 
  FOR ALL 
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'secretary', 'department_leader')
  );

-- Fix attendance policies
CREATE POLICY "attendance_select_all" ON attendance 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "attendance_modify_staff" ON attendance 
  FOR ALL 
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'secretary', 'department_leader')
  );

-- Fix financial_transactions policies
CREATE POLICY "financial_select_staff" ON financial_transactions 
  FOR SELECT 
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'treasurer', 'secretary')
  );

CREATE POLICY "financial_modify_treasurer" ON financial_transactions 
  FOR ALL 
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'treasurer')
  );

-- Fix events policies
CREATE POLICY "events_select_all" ON events 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "events_modify_staff" ON events 
  FOR ALL 
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'secretary', 'department_leader')
  );

-- Fix event_registrations policies
CREATE POLICY "event_registrations_select_all" ON event_registrations 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "event_registrations_insert_authenticated" ON event_registrations 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "event_registrations_modify_staff" ON event_registrations 
  FOR UPDATE 
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'secretary')
  );

-- Fix announcements policies
CREATE POLICY "announcements_select_all" ON announcements 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "announcements_modify_staff" ON announcements 
  FOR ALL 
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'secretary', 'department_leader')
  );

-- Fix communications policies
CREATE POLICY "communications_select_involved" ON communications 
  FOR SELECT 
  TO authenticated
  USING (
    sent_by = auth.uid() OR 
    auth.uid() = ANY(recipient_ids) OR
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'secretary')
  );

CREATE POLICY "communications_insert_staff" ON communications 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'secretary', 'department_leader')
  );

-- Fix meeting_minutes policies
CREATE POLICY "meeting_minutes_select_all" ON meeting_minutes 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "meeting_minutes_modify_leaders" ON meeting_minutes 
  FOR ALL 
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'secretary', 'department_leader')
  );

-- Fix reports policies
CREATE POLICY "reports_select_staff" ON reports 
  FOR SELECT 
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'treasurer', 'secretary')
  );

CREATE POLICY "reports_insert_staff" ON reports 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'treasurer', 'secretary')
  );

-- Fix pledges policies
CREATE POLICY "pledges_select_own_or_staff" ON pledges 
  FOR SELECT 
  TO authenticated
  USING (
    member_id IN (SELECT id FROM members WHERE email = (SELECT email FROM profiles WHERE user_id = auth.uid())) OR
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'treasurer', 'secretary')
  );

CREATE POLICY "pledges_modify_staff" ON pledges 
  FOR ALL 
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'treasurer', 'secretary')
  );

-- Fix system_settings policies
CREATE POLICY "system_settings_select_all" ON system_settings 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "system_settings_modify_admin" ON system_settings 
  FOR ALL 
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) = 'administrator'
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
