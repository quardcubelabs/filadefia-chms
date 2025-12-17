-- INVESTIGATE DOREEN'S CREATION vs NEW USERS
-- Let's find out why Doreen worked but new _fcc@gmail.com users don't

-- 1. Check how Doreen exists in the system
SELECT 'DOREEN AUTH USER:' as check_type;
SELECT id, email, created_at, email_confirmed_at, phone_confirmed_at 
FROM auth.users 
WHERE email = 'mwakabonga_fcc@gmail.com';

SELECT 'DOREEN PROFILE:' as check_type;
SELECT user_id, email, role, first_name, last_name, created_at
FROM profiles 
WHERE email = 'mwakabonga_fcc@gmail.com';

-- 2. Check if there are any email constraints or patterns
SELECT 'EMAIL CONSTRAINTS:' as check_type;
SELECT constraint_name, constraint_type, table_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE ccu.column_name = 'email'
AND tc.table_schema = 'public';

-- 3. Check for email validation triggers or functions
SELECT 'EMAIL TRIGGERS:' as check_type;
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('profiles', 'auth.users')
OR action_statement ILIKE '%email%';

-- 4. Check if there's a unique constraint conflict
SELECT 'EXISTING _FCC EMAILS:' as check_type;
SELECT email, created_at FROM auth.users WHERE email LIKE '%_fcc@gmail.com' ORDER BY created_at;

SELECT 'EXISTING _FCC PROFILES:' as check_type;
SELECT email, role, created_at FROM profiles WHERE email LIKE '%_fcc@gmail.com' ORDER BY created_at;

-- 5. Test if we can create a profile with _fcc format (without auth.users)
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
    'test_fcc@gmail.com',
    'department_leader',
    'Test',
    'Leader', 
    true,
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'department_leader',
    updated_at = NOW();

-- 6. Check if the test profile was created
SELECT 'TEST PROFILE CREATED:' as result;
SELECT * FROM profiles WHERE email = 'test_fcc@gmail.com';

-- 7. Check Supabase auth settings that might block certain email formats
SELECT 'AUTH SETTINGS CHECK:' as info;
-- Check if there are any domain restrictions or email validation rules

-- 8. Try to understand Doreen's creation method
SELECT 'DOREEN CREATION ANALYSIS:' as analysis;
SELECT 
    'Doreen exists in auth.users: ' || CASE WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'mwakabonga_fcc@gmail.com') THEN 'YES' ELSE 'NO' END as auth_status,
    'Doreen exists in profiles: ' || CASE WHEN EXISTS(SELECT 1 FROM profiles WHERE email = 'mwakabonga_fcc@gmail.com') THEN 'YES' ELSE 'NO' END as profile_status;

-- 9. Delete test profile
DELETE FROM profiles WHERE email = 'test_fcc@gmail.com';

SELECT 'INVESTIGATION COMPLETE - Check results above' as status;