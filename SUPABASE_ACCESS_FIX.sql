-- SUPABASE PERMISSION & ACCESS FIX
-- This addresses fundamental access issues in Supabase

-- 1. Check your current database permissions
SELECT 'CURRENT USER PERMISSIONS:' as check_type;
SELECT 
    current_user as database_user,
    session_user as session_user,
    current_setting('role') as current_role;

-- 2. Check if you have proper admin access to auth schema
SELECT 'AUTH SCHEMA ACCESS:' as check_type;
SELECT has_schema_privilege('auth', 'USAGE') as can_access_auth_schema;

-- 3. Check auth.users table permissions
SELECT 'AUTH USERS PERMISSIONS:' as check_type;
SELECT 
    has_table_privilege('auth.users', 'SELECT') as can_select_users,
    has_table_privilege('auth.users', 'INSERT') as can_insert_users,
    has_table_privilege('auth.users', 'UPDATE') as can_update_users,
    has_table_privilege('auth.users', 'DELETE') as can_delete_users;

-- 4. Grant all necessary permissions to current user
GRANT USAGE ON SCHEMA auth TO current_user;
GRANT ALL ON auth.users TO current_user;
GRANT ALL ON auth.identities TO current_user;
GRANT ALL ON auth.sessions TO current_user;

-- 5. Ensure service_role has full access
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT USAGE ON SCHEMA auth TO service_role;

-- 6. Check if RLS is blocking auth operations
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth.identities DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sessions DISABLE ROW LEVEL SECURITY;

-- 7. Remove any problematic policies on auth tables
DROP POLICY IF EXISTS "Users can view own profile" ON auth.users;
DROP POLICY IF EXISTS "Users can update own profile" ON auth.users;

-- 8. Create a function to manually delete users (if dashboard fails)
CREATE OR REPLACE FUNCTION delete_user_completely(user_email text)
RETURNS text AS $$
DECLARE
    user_uuid uuid;
    result_msg text;
BEGIN
    -- Get user ID
    SELECT id INTO user_uuid FROM auth.users WHERE email = user_email;
    
    if user_uuid IS NULL THEN
        RETURN 'User not found: ' || user_email;
    END IF;
    
    -- Delete from profiles first
    DELETE FROM profiles WHERE user_id = user_uuid;
    
    -- Delete from auth.identities
    DELETE FROM auth.identities WHERE user_id = user_uuid;
    
    -- Delete from auth.sessions  
    DELETE FROM auth.sessions WHERE user_id = user_uuid;
    
    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = user_uuid;
    
    RETURN 'Successfully deleted user: ' || user_email;
    
EXCEPTION WHEN OTHERS THEN
    RETURN 'Error deleting user: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to manually create users (if dashboard fails)
CREATE OR REPLACE FUNCTION create_user_manually(user_email text, user_password text, user_role text DEFAULT 'member')
RETURNS text AS $$
DECLARE
    new_user_id uuid;
    result_msg text;
BEGIN
    -- Generate new UUID
    new_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        new_user_id,
        '00000000-0000-0000-0000-000000000000',
        user_email,
        crypt(user_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        false,
        'authenticated'
    );
    
    -- Insert into auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        new_user_id,
        format('{"sub": "%s", "email": "%s"}', new_user_id::text, user_email)::jsonb,
        'email',
        NOW(),
        NOW()
    );
    
    -- Insert into profiles
    INSERT INTO profiles (
        user_id,
        email,
        role,
        first_name,
        last_name,
        is_active,
        created_at
    ) VALUES (
        new_user_id,
        user_email,
        user_role,
        split_part(user_email, '@', 1),
        '',
        true,
        NOW()
    );
    
    RETURN 'Successfully created user: ' || user_email || ' with ID: ' || new_user_id::text;
    
EXCEPTION WHEN OTHERS THEN
    RETURN 'Error creating user: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'PERMISSION FIX COMPLETE' as status;
SELECT 'Now try dashboard operations or use manual functions' as next_step;

-- Test manual user creation (uncomment to test):
-- SELECT create_user_manually('test@example.com', 'FCC2026', 'department_leader');

-- Test manual user deletion (uncomment to test):  
-- SELECT delete_user_completely('test@example.com');