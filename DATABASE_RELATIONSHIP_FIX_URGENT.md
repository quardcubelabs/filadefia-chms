# Database Relationship Fix - URGENT

## Problem Identified
The current database design has a fundamental flaw causing department leader redirect issues:

1. **profiles** table has `user_id` (from auth system)
2. **departments** table has `leader_id` that references `members(id)` instead of auth `user_id`
3. **No direct connection** between authenticated users and department leadership

## Solution
Run this SQL in your Supabase SQL Editor to fix the relationships:

```sql
-- 1. Add new column for direct user reference
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS leader_user_id UUID REFERENCES profiles(user_id);

-- 2. Add department reference to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);

-- 3. Fix Doreen's department leadership specifically
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

-- 4. Verify the fix
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
```

## After Running the SQL
1. The department leader redirect should work immediately
2. Doreen should be redirected to `/departments/{department_id}` when she logs in
3. The complex member matching logic is no longer needed

## What This Fixes
- ✅ Direct `user_id` → department relationship  
- ✅ Eliminates complex member table bridging
- ✅ Proper auth-based department access control
- ✅ Department leader dashboard redirects

## Next Steps
1. Run the SQL above in Supabase SQL Editor
2. Test Doreen's login - she should redirect to Children Department dashboard
3. Remove old complex lookup code once confirmed working

This is the root cause fix you identified - we should find leaders in the profiles table, not bridge through members table!