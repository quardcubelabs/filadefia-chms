-- Check which departments you have access to vs. what you're trying to create minutes for
-- Run this to see the actual department names and IDs

-- Your accessible departments (what RLS policy allows)
SELECT 
    'Your Accessible Departments' as check_type,
    d.id,
    d.name as department_name,
    d.swahili_name,
    dm.position,
    'You can create meeting minutes for this department' as status
FROM department_members dm
JOIN departments d ON dm.department_id = d.id
JOIN members m ON dm.member_id = m.id 
WHERE m.email = 'mwakabonga_fcc@gmail.com'  -- Replace with your actual email
  AND dm.is_active = true
ORDER BY d.name;

-- All active departments (to see what you might be trying to select)
SELECT 
    'All Active Departments' as check_type,
    d.id,
    d.name as department_name,
    d.swahili_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM department_members dm2
            JOIN members m2 ON dm2.member_id = m2.id 
            WHERE dm2.department_id = d.id 
              AND m2.email = 'mwakabonga_fcc@gmail.com'
              AND dm2.is_active = true
        ) THEN 'YES - You have access'
        ELSE 'NO - You do NOT have access'
    END as access_status
FROM departments d
WHERE d.is_active = true
ORDER BY access_status DESC, d.name;

-- Check for any recent meeting minutes to see what department_id was used
SELECT 
    'Recent Meeting Minutes' as check_type,
    mm.department_id,
    d.name as department_name,
    mm.meeting_date,
    mm.meeting_type,
    u.email as created_by_email,
    'This department_id was used in recent minutes' as note
FROM meeting_minutes mm
JOIN departments d ON mm.department_id = d.id
LEFT JOIN auth.users u ON mm.recorded_by = u.id
ORDER BY mm.created_at DESC
LIMIT 5;