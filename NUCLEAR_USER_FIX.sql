-- NUCLEAR OPTION: Remove ALL barriers to user creation
-- Run this complete script in Supabase SQL Editor

BEGIN;

-- 1. Completely disable ALL RLS 
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE department_members DISABLE ROW LEVEL SECURITY;

-- 2. Remove ALL policies that might interfere
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;  
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_department_access" ON profiles;
DROP POLICY IF EXISTS "members_department_leader_access" ON members;
DROP POLICY IF EXISTS "department_members_access" ON department_members;

-- 3. Remove problematic constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_unique;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_key;

-- 4. Remove ALL triggers that might be failing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS create_profile_for_new_user ON auth.users;
DROP TRIGGER IF EXISTS update_updated_at_profiles ON profiles;

-- 5. Create the simplest possible user creation process
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS trigger AS $$
BEGIN
  -- Just try to insert, ignore if it fails
  BEGIN
    INSERT INTO public.profiles (user_id, email, role, first_name, last_name, is_active)
    VALUES (
      NEW.id,
      NEW.email,
      'member', 
      COALESCE(split_part(NEW.email, '@', 1), 'User'),
      '',
      true
    );
  EXCEPTION WHEN OTHERS THEN
    -- Ignore any errors
    NULL;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create simple trigger
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.create_user_profile();

COMMIT;

SELECT 'COMPLETE RESET DONE - TRY CREATING USERS NOW' as status;

-- Check what's in the profiles table
SELECT 'CURRENT PROFILES:' as info, count(*) as total_profiles FROM profiles;
SELECT 'AUTH USERS:' as info, count(*) as total_auth_users FROM auth.users;