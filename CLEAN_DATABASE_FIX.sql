-- Database Relationship Fix - Pure SQL Version
-- Run this clean SQL in Supabase SQL Editor

-- 1. First ensure user_id is unique in profiles (required for foreign key)
ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- 2. Add new column for direct user reference
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS leader_user_id UUID REFERENCES profiles(user_id);

-- 3. Add department reference to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- 4. Fix Doreen's department leadership specifically
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
        -- Set Doreen as Children Department leader using user_id
        UPDATE departments 
        SET leader_user_id = doreen_user_id
        WHERE id = children_dept_id;
        
        -- Set Doreen's department_id in profiles
        UPDATE profiles 
        SET department_id = children_dept_id
        WHERE user_id = doreen_user_id;
        
        RAISE NOTICE 'Successfully linked Doreen to Children Department';
    END IF;
END $$;

-- 5. Verify the fix
SELECT 
    'DOREEN VERIFICATION:' as check_type,
    p.user_id,
    p.email,
    p.first_name || ' ' || p.last_name as name,
    p.role,
    d.name as department_name,
    '/departments/' || d.id as dashboard_url
FROM profiles p
LEFT JOIN departments d ON d.leader_user_id = p.user_id
WHERE p.email = 'mwakabonga_fcc@gmail.com';