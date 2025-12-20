-- Quick diagnostic for department leader report permissions
-- Replace 'mwakabonga_fcc@gmail.com' with your actual email

-- Check your profile and role
SELECT 
    'Your Profile' as check_type,
    email,
    role,
    first_name || ' ' || last_name as name,
    'This should show department_leader' as expected_role
FROM profiles 
WHERE email = 'mwakabonga_fcc@gmail.com';

-- Check what department you lead (via departments.leader_id)
SELECT 
    'Departments You Lead' as check_type,
    d.id as department_id,
    d.name as department_name,
    'You are the leader of this department' as status
FROM departments d
JOIN members m ON d.leader_id = m.id
WHERE m.email = 'mwakabonga_fcc@gmail.com'
  AND d.is_active = true;

-- Check your department_members assignments
SELECT 
    'Your Department Memberships' as check_type,
    d.id as department_id,
    d.name as department_name,
    dm.position,
    dm.is_active,
    'RLS policy will find this department' as note
FROM department_members dm
JOIN departments d ON dm.department_id = d.id
JOIN members m ON dm.member_id = m.id
WHERE m.email = 'mwakabonga_fcc@gmail.com'
  AND dm.is_active = true;

-- Test what the reports RLS policy will actually find
SELECT 
    'What Reports RLS Policy Sees' as check_type,
    department_id,
    'You can create reports for this department_id' as permission
FROM department_members dm
JOIN members m ON dm.member_id = m.id 
WHERE m.email = 'mwakabonga_fcc@gmail.com'
  AND dm.is_active = true;

-- Check if Children's Department exists and what its ID is
SELECT 
    'Childrens Department Info' as check_type,
    id as department_id,
    name,
    swahili_name,
    is_active,
    leader_id,
    'This is the department you are trying to create reports for' as note
FROM departments 
WHERE name ILIKE '%children%' 
   OR swahili_name ILIKE '%watoto%';

-- Final check: See if there's a mismatch
WITH user_leadership AS (
    SELECT d.id, d.name 
    FROM departments d
    JOIN members m ON d.leader_id = m.id
    WHERE m.email = 'mwakabonga_fcc@gmail.com' AND d.is_active = true
),
user_memberships AS (
    SELECT d.id, d.name
    FROM department_members dm
    JOIN departments d ON dm.department_id = d.id
    JOIN members m ON dm.member_id = m.id
    WHERE m.email = 'mwakabonga_fcc@gmail.com' AND dm.is_active = true
)
SELECT 
    'Mismatch Analysis' as check_type,
    'Department you lead: ' || COALESCE(ul.name, 'NONE') as department_led,
    'Departments you are member of: ' || COALESCE((
        SELECT STRING_AGG(name, ', ') FROM user_memberships
    ), 'NONE') as departments_member_of,
    CASE 
        WHEN ul.id IS NULL THEN '❌ You are not set as leader of any department'
        WHEN NOT EXISTS (SELECT 1 FROM user_memberships) THEN '❌ You are not a member of any department'
        WHEN ul.id NOT IN (SELECT id FROM user_memberships) THEN '❌ MISMATCH: You lead a department but are not a member of it'
        ELSE '✅ Everything looks correct'
    END as status
FROM user_leadership ul
FULL OUTER JOIN (SELECT 1 as dummy) d ON true;