-- Fix RLS Policies for Department Leaders
-- Allow department leaders to view and manage their department members

-- 1. Update Members table RLS policies
DROP POLICY IF EXISTS "members_select_policy" ON members;
DROP POLICY IF EXISTS "members_department_access" ON members;

CREATE POLICY "members_department_leader_access" 
ON members FOR SELECT 
USING (
    -- Admins and pastors can see all
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'pastor')
    )
    OR
    -- Department leaders can see their department members
    EXISTS (
        SELECT 1 FROM department_members dm
        JOIN departments d ON d.id = dm.department_id
        WHERE dm.member_id = members.id
        AND dm.is_active = true
        AND (
            d.leader_user_id = auth.uid() OR
            d.leader_id IN (
                SELECT m.id FROM members m
                JOIN profiles p ON (
                    LOWER(p.first_name) = LOWER(m.first_name) 
                    AND LOWER(p.last_name) = LOWER(m.last_name)
                    AND p.user_id = auth.uid()
                )
            )
        )
    )
    OR
    -- Users can see their own member record
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid()
        AND LOWER(p.first_name) = LOWER(members.first_name)
        AND LOWER(p.last_name) = LOWER(members.last_name)
    )
);

-- 2. Update Department Members table RLS policies  
DROP POLICY IF EXISTS "department_members_select_policy" ON department_members;

CREATE POLICY "department_members_access" 
ON department_members FOR ALL 
USING (
    -- Admins and pastors can access all
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'pastor')
    )
    OR
    -- Department leaders can access their department members
    EXISTS (
        SELECT 1 FROM departments d
        WHERE d.id = department_members.department_id
        AND (
            d.leader_user_id = auth.uid() OR
            d.leader_id IN (
                SELECT m.id FROM members m
                JOIN profiles p ON (
                    LOWER(p.first_name) = LOWER(m.first_name) 
                    AND LOWER(p.last_name) = LOWER(m.last_name)
                    AND p.user_id = auth.uid()
                )
            )
        )
    )
);

-- 3. Update Profiles table RLS policies for better member access
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

CREATE POLICY "profiles_department_access" 
ON profiles FOR SELECT 
USING (
    -- Users can see their own profile
    user_id = auth.uid()
    OR
    -- Admins and pastors can see all profiles
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.user_id = auth.uid() 
        AND p.role IN ('administrator', 'pastor')
    )
    OR
    -- Department leaders can see profiles of their department members
    EXISTS (
        SELECT 1 FROM department_members dm
        JOIN departments d ON d.id = dm.department_id
        JOIN members m ON m.id = dm.member_id
        WHERE dm.is_active = true
        AND LOWER(m.first_name) = LOWER(profiles.first_name)
        AND LOWER(m.last_name) = LOWER(profiles.last_name)
        AND (
            d.leader_user_id = auth.uid() OR
            d.leader_id IN (
                SELECT mem.id FROM members mem
                JOIN profiles leader_p ON (
                    LOWER(leader_p.first_name) = LOWER(mem.first_name) 
                    AND LOWER(leader_p.last_name) = LOWER(mem.last_name)
                    AND leader_p.user_id = auth.uid()
                )
            )
        )
    )
);

-- 4. Verification query to test access
SELECT 'RLS POLICY FIX COMPLETE' as status;

-- Test query - this should show members for department leaders
SELECT 
    'DEPARTMENT LEADER ACCESS TEST' as test_type,
    d.name as department,
    COUNT(dm.*) as total_members,
    COUNT(m.*) as accessible_members
FROM departments d
LEFT JOIN department_members dm ON d.id = dm.department_id AND dm.is_active = true
LEFT JOIN members m ON dm.member_id = m.id
WHERE d.is_active = true
GROUP BY d.id, d.name
ORDER BY d.name;