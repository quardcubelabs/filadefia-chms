-- Debug query to check department leader setup for mwakabonga
-- This will help us understand why the redirect isn't working

-- 1. Check if mwakabonga exists in profiles table
SELECT 'PROFILES TABLE' as table_name;
SELECT 
  user_id,
  email,
  first_name,
  last_name,
  role,
  is_active
FROM profiles 
WHERE email LIKE '%mwakabonga%' 
   OR first_name ILIKE '%mwakabonga%' 
   OR last_name ILIKE '%mwakabonga%';

-- 2. Check if mwakabonga exists in members table
SELECT 'MEMBERS TABLE' as table_name;
SELECT 
  id,
  member_number,
  first_name,
  last_name,
  email,
  status
FROM members 
WHERE email LIKE '%mwakabonga%' 
   OR first_name ILIKE '%mwakabonga%' 
   OR last_name ILIKE '%mwakabonga%';

-- 3. Check all departments and their leaders
SELECT 'DEPARTMENTS TABLE' as table_name;
SELECT 
  d.id,
  d.name,
  d.swahili_name,
  d.leader_id,
  d.is_active,
  m.first_name as leader_first_name,
  m.last_name as leader_last_name,
  m.email as leader_email
FROM departments d
LEFT JOIN members m ON d.leader_id = m.id
WHERE d.is_active = true
ORDER BY d.name;

-- 4. Check if there's any department with children in the name
SELECT 'CHILDREN DEPARTMENTS' as table_name;
SELECT 
  d.id,
  d.name,
  d.swahili_name,
  d.leader_id,
  d.is_active,
  m.first_name as leader_first_name,
  m.last_name as leader_last_name,
  m.email as leader_email
FROM departments d
LEFT JOIN members m ON d.leader_id = m.id
WHERE (d.name ILIKE '%children%' OR d.swahili_name ILIKE '%watoto%')
  AND d.is_active = true;

-- 5. Show all department leaders (any department with a leader assigned)
SELECT 'ALL DEPARTMENT LEADERS' as table_name;
SELECT 
  d.name as department_name,
  m.first_name,
  m.last_name,
  m.email,
  p.email as profile_email,
  p.role as profile_role
FROM departments d
INNER JOIN members m ON d.leader_id = m.id
LEFT JOIN profiles p ON (p.first_name = m.first_name AND p.last_name = m.last_name) OR p.email = m.email
WHERE d.is_active = true
ORDER BY d.name;