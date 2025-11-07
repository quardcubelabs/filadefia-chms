# RLS Policy Fix Instructions

## Problem
Error: "infinite recursion detected in policy for relation 'profiles'"

This occurs when RLS policies reference themselves in a circular way.

## Quick Fix

**Run this SQL in your Supabase SQL Editor:**

```sql
-- STEP 1: Drop problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Staff can manage members" ON members;
DROP POLICY IF EXISTS "Authenticated users can view members" ON members;

-- STEP 2: Create fixed policies for profiles (no circular reference)
CREATE POLICY "profiles_select_own" ON profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert" ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Admin policy with LIMIT 1 to prevent recursion
CREATE POLICY "profiles_admin_all" ON profiles 
  FOR ALL 
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor')
  );

-- STEP 3: Fix members policies
CREATE POLICY "members_select_authenticated" ON members 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "members_insert_staff" ON members 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'secretary')
  );

CREATE POLICY "members_update_staff" ON members 
  FOR UPDATE 
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor', 'secretary')
  );
```

## Alternative: Disable RLS Temporarily (FOR DEVELOPMENT ONLY)

If you need to test quickly, you can temporarily disable RLS:

```sql
-- WARNING: Only for development/testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
```

**Remember to re-enable RLS before production:**

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
```

## After Running the Fix

1. Clear your browser cache
2. Restart your Next.js dev server: `npm run dev`
3. Try logging in again

The error should be resolved!

## Full Migration Available

For a complete RLS policy fix, run the migration file:
`database/migrations/fix_rls_policies.sql`
