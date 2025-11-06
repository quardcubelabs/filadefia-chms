# Quick Fix: Profile Not Found Error

## Problem
You're seeing the error: `Error loading profile: {}` when trying to log in.

## Cause
The logged-in user doesn't have a corresponding profile record in the `profiles` table.

## Solution

### Step 1: Run the Migration in Supabase

1. Open your Supabase project dashboard: https://supabase.com/dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    'member',
    COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users
INSERT INTO public.profiles (user_id, email, role, first_name, last_name)
SELECT 
  id,
  email,
  'member',
  COALESCE(raw_user_meta_data->>'first_name', SPLIT_PART(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'last_name', '')
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;
```

5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

### Step 2: Verify the Fix

1. Go to **Table Editor** in Supabase
2. Select the `profiles` table
3. Check if your user now has a profile record
4. The `user_id` should match your user ID in `auth.users`

### Step 3: Refresh the Application

1. Go back to your application: http://localhost:3000
2. Refresh the page (F5)
3. Try logging in again

## What This Does

✅ **Automatic Profile Creation**: From now on, whenever someone signs up, a profile is automatically created

✅ **Backfills Existing Users**: Creates profiles for all existing users who don't have one

✅ **Prevents Duplicates**: Uses `ON CONFLICT DO NOTHING` to prevent duplicate profile records

✅ **Sets Defaults**: New users get the 'member' role by default

## Alternative: Quick Manual Fix

If you just want to fix your current user without running the full migration:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query (replace `YOUR_USER_ID` with your actual user ID):

```sql
INSERT INTO public.profiles (user_id, email, role, first_name, last_name)
SELECT 
  id,
  email,
  'administrator', -- or 'member', 'pastor', etc.
  SPLIT_PART(email, '@', 1),
  ''
FROM auth.users
WHERE id = 'YOUR_USER_ID'
ON CONFLICT (user_id) DO NOTHING;
```

To find your user ID:
```sql
SELECT id, email FROM auth.users;
```

## Still Not Working?

Check the browser console for more detailed error messages:
1. Open Developer Tools (F12)
2. Go to the Console tab
3. Look for error messages
4. Share them with the development team

## Future Prevention

The code has been updated to:
- Automatically create profiles when they're missing
- Show better error messages
- Handle the "profile not found" case gracefully
