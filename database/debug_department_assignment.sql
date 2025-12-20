-- Debug and fix department leader assignment for meeting minutes
-- This script checks and fixes the department_members table assignment

-- Step 1: Check current user's profile and department relationship
SELECT 
    'Current User Profile' as check_type,
    p.email,
    p.first_name || ' ' || p.last_name as name,
    p.role,
    p.user_id,
    d.id as led_department_id,
    d.name as led_department_name
FROM profiles p
LEFT JOIN departments d ON d.leader_id = p.user_id
WHERE p.email = 'mwakabonga_fcc@gmail.com';  -- Replace with your actual email

-- Step 2: Check if user exists in members table
SELECT 
    'Member Record Check' as check_type,
    m.id as member_id,
    m.email,
    m.first_name || ' ' || m.last_name as name,
    'Member exists' as status
FROM members m
WHERE m.email = 'mwakabonga_fcc@gmail.com';  -- Replace with your actual email

-- Step 3: Check department_members assignment
SELECT 
    'Department Members Check' as check_type,
    dm.id,
    dm.department_id,
    d.name as department_name,
    dm.member_id,
    m.email as member_email,
    m.first_name || ' ' || m.last_name as member_name,
    dm.position,
    dm.is_active
FROM department_members dm
JOIN departments d ON dm.department_id = d.id
JOIN members m ON dm.member_id = m.id
WHERE m.email = 'mwakabonga_fcc@gmail.com';  -- Replace with your actual email

-- Step 4: If missing, add user to department_members table
-- First, find the user's member record and their led department
WITH user_info AS (
    SELECT 
        p.email as user_email,
        p.user_id,
        m.id as member_id,
        d.id as department_id,
        d.name as department_name
    FROM profiles p
    LEFT JOIN departments d ON d.leader_id = p.user_id
    LEFT JOIN members m ON m.email = p.email
    WHERE p.email = 'mwakabonga_fcc@gmail.com'  -- Replace with your actual email
      AND p.role = 'department_leader'
)
INSERT INTO department_members (department_id, member_id, position, joined_date, is_active)
SELECT 
    ui.department_id,
    ui.member_id,
    'chairperson'::department_position,
    CURRENT_DATE,
    true
FROM user_info ui
WHERE ui.member_id IS NOT NULL 
  AND ui.department_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM department_members dm 
    WHERE dm.member_id = ui.member_id 
      AND dm.department_id = ui.department_id
  );

-- Step 5: Verification - Check the fix
SELECT 
    'Final Verification' as check_type,
    p.email as user_email,
    p.role,
    d.name as department_name,
    dm.position,
    dm.is_active as department_member_active,
    'Should be able to create meeting minutes now' as status
FROM profiles p
JOIN departments d ON d.leader_id = p.user_id
JOIN members m ON m.email = p.email
JOIN department_members dm ON dm.member_id = m.id AND dm.department_id = d.id
WHERE p.email = 'mwakabonga_fcc@gmail.com';  -- Replace with your actual email

-- Show what the RLS policy will find
SELECT 
    'RLS Policy Check' as check_type,
    'What the policy will find for your email:' as description,
    dm.department_id
FROM department_members dm
JOIN members m ON dm.member_id = m.id 
WHERE m.email = 'mwakabonga_fcc@gmail.com'  -- Replace with your actual email
  AND dm.is_active = true;