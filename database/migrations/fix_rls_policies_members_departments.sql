-- Fix RLS Policies for Members and Departments Tables
-- Run this in Supabase SQL Editor to enable CRUD operations

-- ========================================
-- DROP EXISTING POLICIES
-- ========================================

-- Drop existing members policies
DROP POLICY IF EXISTS "Authenticated users can view members" ON members;
DROP POLICY IF EXISTS "Staff can manage members" ON members;

-- Drop existing departments policies  
DROP POLICY IF EXISTS "Authenticated users can view departments" ON departments;
DROP POLICY IF EXISTS "Staff can manage departments" ON departments;

-- Drop existing department_members policies
DROP POLICY IF EXISTS "Authenticated users can view department_members" ON department_members;
DROP POLICY IF EXISTS "Staff can manage department_members" ON department_members;

-- ========================================
-- CREATE NEW POLICIES FOR MEMBERS TABLE
-- ========================================

-- Allow authenticated users to read all members
CREATE POLICY "authenticated_select_members" 
ON members 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert members
CREATE POLICY "authenticated_insert_members" 
ON members 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update members
CREATE POLICY "authenticated_update_members" 
ON members 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Allow authenticated users to delete members
CREATE POLICY "authenticated_delete_members" 
ON members 
FOR DELETE 
TO authenticated 
USING (true);

-- ========================================
-- CREATE NEW POLICIES FOR DEPARTMENTS TABLE
-- ========================================

-- Allow authenticated users to read all departments
CREATE POLICY "authenticated_select_departments" 
ON departments 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert departments
CREATE POLICY "authenticated_insert_departments" 
ON departments 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update departments
CREATE POLICY "authenticated_update_departments" 
ON departments 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Allow authenticated users to delete departments
CREATE POLICY "authenticated_delete_departments" 
ON departments 
FOR DELETE 
TO authenticated 
USING (true);

-- ========================================
-- CREATE NEW POLICIES FOR DEPARTMENT_MEMBERS TABLE
-- ========================================

-- Allow authenticated users to read department members
CREATE POLICY "authenticated_select_department_members" 
ON department_members 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert department members
CREATE POLICY "authenticated_insert_department_members" 
ON department_members 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update department members
CREATE POLICY "authenticated_update_department_members" 
ON department_members 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Allow authenticated users to delete department members
CREATE POLICY "authenticated_delete_department_members" 
ON department_members 
FOR DELETE 
TO authenticated 
USING (true);

-- ========================================
-- VERIFICATION
-- ========================================

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('members', 'departments', 'department_members')
ORDER BY tablename, policyname;
