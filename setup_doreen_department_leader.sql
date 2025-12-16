-- Fix Department Leader Setup for Doreen (mwakabonga_fcc@gmail.com)
-- NEW APPROACH: Link departments directly to profiles (user_id) instead of members

-- First, get Doreen's profile user_id
SELECT 'Doreen Profile Record:' as status;
SELECT user_id, email, first_name, last_name, role
FROM profiles 
WHERE email = 'mwakabonga_fcc@gmail.com';

-- Check current department structure
SELECT 'Current Department Schema:' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'departments' 
ORDER BY ordinal_position;

-- Create or update Children Department with Doreen's user_id as leader
WITH doreen_profile AS (
    SELECT user_id, first_name, last_name
    FROM profiles 
    WHERE email = 'mwakabonga_fcc@gmail.com'
)

INSERT INTO departments (
    id,
    name,
    swahili_name,
    description,
    leader_id,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Children Department',
    'Idara ya Watoto',
    'Department for children ministry and programs',
    dp.user_id,  -- Doreen's user_id as leader
    true,
    NOW(),
    NOW()
FROM doreen_profile dp
WHERE NOT EXISTS (
    SELECT 1 FROM departments 
    WHERE name = 'Children Department'
);

-- If Children department already exists, update the leader to use user_id
UPDATE departments 
SET leader_id = (
    SELECT user_id FROM profiles 
    WHERE email = 'mwakabonga_fcc@gmail.com'
)
WHERE name ILIKE '%children%' AND is_active = true;

-- Final verification: Show the complete setup using profile-based leadership
SELECT 'FINAL VERIFICATION - Profile-Based Department Leadership:' as status;
SELECT 
    d.id as department_id,
    d.name as department_name,
    d.swahili_name,
    d.leader_id,
    p.first_name as profile_first_name,
    p.last_name as profile_last_name,
    p.email as profile_email,
    p.role as profile_role,
    '/departments/' || d.id as redirect_url
FROM departments d
INNER JOIN profiles p ON d.leader_id = p.user_id
WHERE p.email = 'mwakabonga_fcc@gmail.com'
   OR d.name ILIKE '%children%'
ORDER BY d.name;

-- Show all departments and their leader types for debugging
SELECT 'DEPARTMENT LEADER ANALYSIS:' as status;
SELECT 
    d.name as department_name,
    d.leader_id,
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE user_id = d.leader_id) THEN 'Profile/User ID'
        WHEN EXISTS (SELECT 1 FROM members WHERE id = d.leader_id) THEN 'Member ID'
        ELSE 'Unknown'
    END as leader_id_type,
    COALESCE(p.email, m.email, 'No match') as leader_email
FROM departments d
LEFT JOIN profiles p ON d.leader_id = p.user_id
LEFT JOIN members m ON d.leader_id = m.id
WHERE d.is_active = true
ORDER BY d.name;

-- Instructions for manual setup if needed
SELECT '
MANUAL SETUP INSTRUCTIONS:
1. If no member record exists, create one in the Members page
2. If no department exists, create "Children Department" in Departments page  
3. Set Doreen as the leader of the Children Department
4. The redirect URL should be: /departments/{department-id}
' as instructions;