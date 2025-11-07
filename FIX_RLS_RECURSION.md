# Fix RLS Infinite Recursion Error

## Problem
You're seeing this error: `"infinite recursion detected in policy for relation \"profiles\""`

This happens because the RLS policies on the `profiles` table are querying the same table, creating a circular dependency.

## Solution

### Option 1: Apply via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database/migrations/fix_rls_infinite_recursion.sql`
4. Click **Run** to execute the SQL
5. Refresh your application

### Option 2: Apply via Supabase CLI

```bash
# Make sure you're in the project directory
cd C:\Users\Hosiana.walter\Music\chms\fcc-chms

# Run the migration
supabase db push
```

### Option 3: Manual Fix via SQL

If the migration file doesn't work, you can manually run these commands in the Supabase SQL Editor:

```sql
-- 1. Disable RLS temporarily (OPTIONAL - only if policies won't drop)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_simple" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- 3. Re-enable RLS (if you disabled it)
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create simple, non-recursive policies
CREATE POLICY "profiles_read_own" ON profiles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_update_own_simple" ON profiles 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON profiles 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

## What Changed

### Before (Causing Recursion)
```sql
-- This policy queries the profiles table WHILE defining a policy ON profiles
-- This creates infinite recursion!
CREATE POLICY "profiles_admin_all" ON profiles 
  FOR ALL 
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1) IN ('administrator', 'pastor')
  );
```

### After (No Recursion)
```sql
-- Simple policy that only checks auth.uid() - no table queries
CREATE POLICY "profiles_read_own" ON profiles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);
```

## Important Notes

1. **Role-Based Access Control**: The new policies allow all authenticated users to access data. Role-based permissions are now handled in the **application layer** (in your Next.js code) rather than at the database level. This is a common and valid approach.

2. **Security**: Users can still only read/update their OWN profile. For other tables (members, departments, etc.), all authenticated users have access, but you should implement role checks in your API routes and server components.

3. **Service Role**: The service role (used by your backend) bypasses RLS completely, allowing admin operations to work properly.

## Verify the Fix

After applying the migration:

1. Refresh your browser (Ctrl+Shift+R)
2. Log in to your application
3. Check the browser console - the error should be gone
4. Try accessing the dashboard and member pages

## If Issues Persist

If you still see the error after applying the fix:

1. **Clear your browser cache** completely
2. **Sign out and sign in** again
3. **Check Supabase logs** in your dashboard under "Logs" → "Postgres Logs"
4. **Verify policies were created** by running:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

## Need More Help?

If the error persists, you can temporarily disable RLS on the profiles table for testing:

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

⚠️ **Warning**: Only do this in development! Never disable RLS in production.
