-- Comprehensive fix for member-department relationships
-- This ensures every member is properly assigned to a department

-- Step 1: Find members missing from department_members table
SELECT 
    'Members Missing Department Assignment' as check_type,
    m.id as member_id,
    m.first_name || ' ' || m.last_name as member_name,
    m.email,
    'Missing from department_members table' as issue
FROM members m
LEFT JOIN department_members dm ON m.id = dm.member_id
WHERE dm.member_id IS NULL
ORDER BY m.last_name;

-- Step 2: Show current department assignments
SELECT 
    'Current Department Assignments' as check_type,
    d.name as department_name,
    COUNT(dm.member_id) as member_count,
    ARRAY_AGG(m.first_name || ' ' || m.last_name ORDER BY m.last_name) as members
FROM departments d
LEFT JOIN department_members dm ON d.id = dm.department_id AND dm.is_active = true
LEFT JOIN members m ON dm.member_id = m.id
WHERE d.is_active = true
GROUP BY d.id, d.name
ORDER BY d.name;

-- Step 3: Auto-assign missing members to appropriate departments
-- Priority: 
-- 1. If they lead a department, assign them as chairperson to that department
-- 2. Otherwise, assign them to a default department (e.g., General/Members)

-- First, assign department leaders to their departments as chairperson
WITH department_leaders AS (
    SELECT 
        m.id as member_id,
        d.id as department_id,
        'chairperson'::department_position as position
    FROM members m
    JOIN departments d ON d.leader_id = m.id
    WHERE d.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM department_members dm 
        WHERE dm.member_id = m.id 
          AND dm.department_id = d.id
      )
)
INSERT INTO department_members (department_id, member_id, position, joined_date, is_active)
SELECT department_id, member_id, position, CURRENT_DATE, true
FROM department_leaders;

-- Step 4: Create a default "General Members" department if it doesn't exist
INSERT INTO departments (id, name, swahili_name, description, is_active, created_at)
SELECT 
    gen_random_uuid(),
    'General Members',
    'Wanachama wa Jumla',
    'Default department for members not assigned to specific departments',
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM departments 
    WHERE name = 'General Members'
);

-- Step 5: Assign remaining unassigned members to General Members department
WITH unassigned_members AS (
    SELECT 
        m.id as member_id,
        d.id as general_dept_id
    FROM members m
    CROSS JOIN (
        SELECT id FROM departments WHERE name = 'General Members' LIMIT 1
    ) d
    WHERE NOT EXISTS (
        SELECT 1 FROM department_members dm 
        WHERE dm.member_id = m.id 
          AND dm.is_active = true
      )
)
INSERT INTO department_members (department_id, member_id, position, joined_date, is_active)
SELECT general_dept_id, member_id, 'member'::department_position, CURRENT_DATE, true
FROM unassigned_members;

-- Step 6: Verification - Show final department assignments
SELECT 
    'Final Department Assignments' as check_type,
    d.name as department_name,
    COUNT(dm.member_id) as member_count,
    STRING_AGG(
        m.first_name || ' ' || m.last_name || ' (' || dm.position || ')', 
        ', ' ORDER BY dm.position DESC, m.last_name
    ) as members_with_positions
FROM departments d
LEFT JOIN department_members dm ON d.id = dm.department_id AND dm.is_active = true
LEFT JOIN members m ON dm.member_id = m.id
WHERE d.is_active = true
GROUP BY d.id, d.name
HAVING COUNT(dm.member_id) > 0
ORDER BY d.name;

-- Step 7: Check for any remaining unassigned members (should be zero)
SELECT 
    'Verification - Still Unassigned Members' as check_type,
    COUNT(*) as unassigned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All members are now assigned to departments'
        ELSE '❌ Some members are still unassigned - needs investigation'
    END as status
FROM members m
LEFT JOIN department_members dm ON m.id = dm.member_id AND dm.is_active = true
WHERE dm.member_id IS NULL;

-- Step 8: Final RLS policy test for your specific user
SELECT 
    'Your Final RLS Access' as check_type,
    'Departments you can create meeting minutes for:' as description,
    d.name as department_name,
    dm.position as your_position
FROM department_members dm
JOIN departments d ON dm.department_id = d.id
JOIN members m ON dm.member_id = m.id 
WHERE m.email = 'mwakabonga_fcc@gmail.com'  -- Replace with your actual email
  AND dm.is_active = true
  AND d.is_active = true
ORDER BY d.name;