-- PERMISSION-LIMITED USER CREATION FIX
-- This works without needing auth table ownership

-- 1. Check what permissions you actually have
SELECT 'YOUR CURRENT ROLE:' as info, current_user, session_user;
SELECT 'DATABASE NAME:' as info, current_database();

-- 2. Since you can't modify auth tables, let's work with profiles only
-- First make sure you can work with profiles table
SELECT 'PROFILES TABLE ACCESS:' as info;
SELECT 
    has_table_privilege('profiles', 'SELECT') as can_select,
    has_table_privilege('profiles', 'INSERT') as can_insert, 
    has_table_privilege('profiles', 'UPDATE') as can_update,
    has_table_privilege('profiles', 'DELETE') as can_delete;

-- 3. Create department leader profiles directly (they can sign up later)
-- This bypasses the auth.users table completely

-- Create profile for mwakalanga (update to department_leader role)
INSERT INTO profiles (
    user_id,
    email, 
    role,
    first_name,
    last_name,
    is_active,
    created_at
) VALUES (
    gen_random_uuid(),  -- Temporary UUID, will be replaced when they sign up
    'mwakalanga_fcc@gmail.com',
    'department_leader', 
    'Mwakalanga',
    '',
    true,
    NOW()
) ON CONFLICT (email) DO UPDATE SET 
    role = 'department_leader',
    first_name = 'Mwakalanga',
    updated_at = NOW();

-- 4. Check what we created
SELECT 'CREATED PROFILES:' as info;
SELECT * FROM profiles WHERE email LIKE '%mwakalanga%';

SELECT 'SOLUTION: Use Supabase Dashboard Authentication → Settings → Enable Signups' as next_step;
SELECT 'Then share signup link: https://your-app.com/signup with department leaders' as instruction;

-- 5. Alternative: Create a signup invitation system
CREATE OR REPLACE FUNCTION create_leader_invitation(leader_email text, leader_name text, dept_name text)
RETURNS text AS $$
BEGIN
    -- Insert or update profile with invitation status
    INSERT INTO profiles (
        user_id,
        email,
        role, 
        first_name,
        last_name,
        is_active,
        created_at
    ) VALUES (
        gen_random_uuid(),
        leader_email,
        'department_leader',
        leader_name,
        dept_name || ' Leader',
        false,  -- Not active until they sign up
        NOW()
    ) ON CONFLICT (email) DO UPDATE SET
        role = 'department_leader',
        first_name = leader_name,
        last_name = dept_name || ' Leader',
        updated_at = NOW();
        
    RETURN 'Invitation created for: ' || leader_email || ' (' || leader_name || ')';
END;
$$ LANGUAGE plpgsql;

-- Create invitations for all department leaders
SELECT create_leader_invitation('mwakalanga_fcc@gmail.com', 'Mwakalanga', 'Children');
-- Add more as needed:
-- SELECT create_leader_invitation('other_leader@gmail.com', 'Name', 'Department');

SELECT 'WORKAROUND COMPLETE - Check next steps below' as status;