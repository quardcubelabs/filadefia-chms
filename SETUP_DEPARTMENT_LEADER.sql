-- Setup Department Leader for Testing
-- Run this in your Supabase SQL Editor to make yourself a department leader

-- First, check your current user and profile
SELECT 
    auth.uid() as current_user_id,
    p.id as profile_id,
    p.first_name,
    p.last_name, 
    p.email,
    p.role
FROM profiles p 
WHERE p.id = auth.uid();

-- Check what departments exist
SELECT id, name, leader_user_id, leader_id, is_active 
FROM departments 
WHERE is_active = true
ORDER BY name;

-- Make yourself the leader of the first department
-- (This will make you see only transactions for that department)
UPDATE departments 
SET leader_user_id = auth.uid()
WHERE is_active = true 
  AND id = (SELECT id FROM departments WHERE is_active = true ORDER BY name LIMIT 1);

-- Also update your profile role to be department_leader
UPDATE profiles 
SET role = 'department_leader'
WHERE id = auth.uid();

-- Verify the setup
SELECT 
    d.name as department_name,
    d.id as department_id,
    p.first_name || ' ' || p.last_name as leader_name,
    p.role,
    COUNT(ft.id) as transaction_count
FROM departments d
LEFT JOIN profiles p ON d.leader_user_id = p.id
LEFT JOIN financial_transactions ft ON ft.department_id = d.id
WHERE d.is_active = true AND d.leader_user_id = auth.uid()
GROUP BY d.id, d.name, p.first_name, p.last_name, p.role;

-- Show how many transactions this department should have
SELECT 
    'Total transactions in your department' as info,
    COUNT(*) as count
FROM financial_transactions ft
JOIN departments d ON ft.department_id = d.id
WHERE d.leader_user_id = auth.uid() AND d.is_active = true;