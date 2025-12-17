-- QUICK FIX: Department Leader RLS Policies
-- Run this in Supabase SQL Editor to allow department leaders to see their members

-- Fix Members table access
DROP POLICY IF EXISTS "members_select_policy" ON members;
CREATE POLICY "members_department_leader_access" 
ON members FOR SELECT 
USING (
    -- Admins/pastors see all
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('administrator', 'pastor'))
    OR
    -- Department leaders see their department members  
    EXISTS (
        SELECT 1 FROM department_members dm
        JOIN departments d ON d.id = dm.department_id
        WHERE dm.member_id = members.id AND dm.is_active = true
        AND d.leader_user_id = auth.uid()
    )
    OR
    -- Users see their own record
    EXISTS (
        SELECT 1 FROM profiles p WHERE p.user_id = auth.uid()
        AND LOWER(p.first_name) = LOWER(members.first_name)
        AND LOWER(p.last_name) = LOWER(members.last_name)
    )
);

-- Fix Department Members table access
DROP POLICY IF EXISTS "department_members_select_policy" ON department_members;
CREATE POLICY "department_members_access" 
ON department_members FOR ALL 
USING (
    -- Admins/pastors access all
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('administrator', 'pastor'))
    OR
    -- Department leaders access their department
    EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_members.department_id
        AND d.leader_user_id = auth.uid()
    )
);

-- Verify fix
SELECT 'RLS POLICIES UPDATED FOR DEPARTMENT LEADER ACCESS' as status;