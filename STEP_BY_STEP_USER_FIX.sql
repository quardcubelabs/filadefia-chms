-- STEP-BY-STEP USER CREATION FIX
-- After running the nuclear script, try this approach:

-- 1. First, verify the nuclear script worked
SELECT 'RLS STATUS CHECK:' as status;
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'members', 'departments', 'department_members');

-- 2. Check if trigger was created
SELECT 'TRIGGER CHECK:' as status;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'create_user_profile_trigger';

-- 3. If Supabase dashboard STILL doesn't work, manually create users:
-- (Only run these if dashboard creation fails)

-- Create auth user manually (replace email/password as needed)
/*
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'mwakalanga_fcc@gmail.com',
    crypt('FCC2026', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);
*/

-- 4. Create profile manually (run this after creating auth user)
/*
INSERT INTO profiles (
    user_id,
    email,
    role,
    first_name,
    last_name,
    is_active,
    created_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'mwakalanga_fcc@gmail.com'),
    'mwakalanga_fcc@gmail.com',
    'department_leader',
    'Mwakalanga',
    '',
    true,
    NOW()
);
*/

SELECT 'SETUP COMPLETE - NOW TRY SUPABASE DASHBOARD TO CREATE USERS' as final_status;