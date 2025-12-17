-- Fix Database Design: Proper User-Department Relationships
-- This migration fixes the fundamental design flaw by establishing direct relationships
-- between authenticated users (profiles) and their departments

BEGIN;

-- 1. First, ensure user_id is unique in profiles table (required for foreign key)
ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- 2. Add department_id column to profiles table for direct user-department relationship
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- 3. Modify departments table to use user_id instead of member_id for leaders
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS leader_user_id UUID REFERENCES profiles(user_id);

-- 4. Create a function to sync the old member-based leadership to user-based leadership
CREATE OR REPLACE FUNCTION sync_department_leadership() 
RETURNS void AS $$
DECLARE
    dept RECORD;
    profile_user_id UUID;
BEGIN
    -- For each department with a current leader_id (member-based)
    FOR dept IN 
        SELECT d.id, d.name, d.leader_id, m.first_name, m.last_name, m.email
        FROM departments d
        JOIN members m ON d.leader_id = m.id
        WHERE d.is_active = true AND d.leader_id IS NOT NULL
    LOOP
        -- Find or create matching profile for this member
        SELECT user_id INTO profile_user_id
        FROM profiles p
        WHERE LOWER(p.first_name) = LOWER(dept.first_name) 
          AND LOWER(p.last_name) = LOWER(dept.last_name)
          AND p.role = 'department_leader'
        LIMIT 1;
        
        -- If profile found, update department to use user_id
        IF profile_user_id IS NOT NULL THEN
            UPDATE departments 
            SET leader_user_id = profile_user_id
            WHERE id = dept.id;
            
            -- Also set the leader's department_id in profiles
            UPDATE profiles 
            SET department_id = dept.id
            WHERE user_id = profile_user_id;
            
            RAISE NOTICE 'Linked department % to user_id %', dept.name, profile_user_id;
        ELSE
            RAISE NOTICE 'No profile found for department leader: % %', dept.first_name, dept.last_name;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Execute the sync function
SELECT sync_department_leadership();

-- 6. Special case: Ensure Doreen is properly set up
DO $$ 
DECLARE
    doreen_user_id UUID;
    children_dept_id UUID;
BEGIN
    -- Get Doreen's user_id from profiles
    SELECT user_id INTO doreen_user_id
    FROM profiles 
    WHERE email = 'mwakabonga_fcc@gmail.com'
    LIMIT 1;
    
    -- Get Children Department ID
    SELECT id INTO children_dept_id
    FROM departments 
    WHERE name = 'Children Department'
    LIMIT 1;
    
    IF doreen_user_id IS NOT NULL AND children_dept_id IS NOT NULL THEN
        -- Set Doreen as Children Department leader
        UPDATE departments 
        SET leader_user_id = doreen_user_id
        WHERE id = children_dept_id;
        
        -- Set Doreen's department_id
        UPDATE profiles 
        SET department_id = children_dept_id
        WHERE user_id = doreen_user_id;
        
        RAISE NOTICE 'Successfully linked Doreen (%) to Children Department (%)', doreen_user_id, children_dept_id;
    ELSE
        RAISE NOTICE 'Could not find Doreen profile or Children Department';
    END IF;
END $$;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_departments_leader_user_id ON departments(leader_user_id);

-- 8. Update RLS policies to work with new structure
-- Drop old policies that might be using member-based logic
DROP POLICY IF EXISTS "department_leaders_select" ON departments;
DROP POLICY IF EXISTS "department_leaders_update" ON departments;

-- Create new policies using user_id
CREATE POLICY "department_leaders_can_view_own_department" 
ON departments FOR SELECT 
USING (
    leader_user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'pastor')
    )
);

CREATE POLICY "department_leaders_can_update_own_department" 
ON departments FOR UPDATE 
USING (
    leader_user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('administrator', 'pastor')
    )
);

-- 9. Verification query
CREATE OR REPLACE VIEW department_leadership_view AS
SELECT 
    p.user_id,
    p.email,
    p.first_name || ' ' || p.last_name as leader_name,
    p.role,
    d.id as department_id,
    d.name as department_name,
    '/departments/' || d.id as dashboard_url,
    CASE 
        WHEN p.user_id IS NOT NULL AND d.id IS NOT NULL THEN 'PROPERLY_LINKED'
        WHEN p.user_id IS NOT NULL AND d.id IS NULL THEN 'NO_DEPARTMENT'
        ELSE 'NO_PROFILE'
    END as status
FROM profiles p
LEFT JOIN departments d ON d.leader_user_id = p.user_id
WHERE p.role = 'department_leader'
ORDER BY d.name NULLS LAST;

COMMIT;

-- Final verification
SELECT 'DATABASE FIX COMPLETE - VERIFICATION:' as message;
SELECT * FROM department_leadership_view;

-- Specific check for Doreen
SELECT 
    'DOREEN CHECK:' as check_type,
    p.user_id,
    p.email,
    p.department_id,
    d.name as leads_department,
    d.leader_user_id = p.user_id as is_properly_linked
FROM profiles p
LEFT JOIN departments d ON p.department_id = d.id
WHERE p.email = 'mwakabonga_fcc@gmail.com';