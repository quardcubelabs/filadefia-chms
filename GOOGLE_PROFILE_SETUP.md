# Google Profile Integration - Setup Instructions

## What's Been Updated

The authentication system has been updated to capture and display Google profile information (avatar image and full name) when users sign in with Google.

## Changes Made

### 1. Updated Profile Creation in `src/hooks/useAuth.ts`
- Now extracts `avatar_url` or `picture` from Google OAuth metadata
- Parses `full_name` into `first_name` and `last_name`
- Stores Google profile image URL in the database

### 2. Updated Dashboard Display in `src/app/dashboard/page.tsx`
- Header greeting now shows user's first name from profile
- Avatar image now displays Google profile picture if available
- Falls back to DiceBear avatar if no Google image exists

### 3. Database Migration Created
- Location: `database/migrations/update_user_profile_google_auth.sql`
- Updates the `handle_new_user()` trigger function to capture Google data
- Applies to all future Google sign-ins

## Setup Steps

### Step 1: Run the Database Migration

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `database/migrations/update_user_profile_google_auth.sql`
5. Click **Run** to execute the migration

The migration SQL is:

\`\`\`sql
-- Update the handle_new_user function to capture Google OAuth profile data
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  full_name TEXT;
  first_name TEXT;
  last_name TEXT;
  avatar_url TEXT;
BEGIN
  -- Extract full name from Google OAuth metadata
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Extract avatar URL from Google OAuth metadata (try both 'avatar_url' and 'picture')
  avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );
  
  -- Parse first and last name
  IF full_name != '' THEN
    first_name := SPLIT_PART(full_name, ' ', 1);
    last_name := TRIM(SUBSTRING(full_name FROM LENGTH(SPLIT_PART(full_name, ' ', 1)) + 2));
  ELSE
    first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(NEW.email, '@', 1));
    last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  END IF;
  
  -- Insert profile with Google data
  INSERT INTO public.profiles (user_id, email, role, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    'member',
    first_name,
    last_name,
    avatar_url
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
\`\`\`

### Step 2: Update Existing Google Users (Optional)

If you already have users who signed in with Google before this update, their profiles won't have the avatar URL. You can:

**Option A: Sign Out and Sign In Again**
- Sign out from your account
- Sign in again with Google
- This will create a new profile with the Google avatar

**Option B: Manually Update Profile**
1. Go to Supabase Dashboard → Authentication → Users
2. Click on your user
3. Copy the avatar URL from `user_metadata.avatar_url` or `user_metadata.picture`
4. Go to Table Editor → profiles
5. Find your profile record
6. Paste the avatar URL into the `avatar_url` field

**Option C: Run SQL Update (Advanced)**
If you have multiple existing Google users, run this in SQL Editor:

\`\`\`sql
-- Update existing profiles with Google avatar URLs
UPDATE profiles
SET 
  avatar_url = COALESCE(
    auth.users.raw_user_meta_data->>'avatar_url',
    auth.users.raw_user_meta_data->>'picture'
  ),
  first_name = CASE 
    WHEN auth.users.raw_user_meta_data->>'full_name' IS NOT NULL 
    THEN SPLIT_PART(auth.users.raw_user_meta_data->>'full_name', ' ', 1)
    ELSE profiles.first_name
  END,
  last_name = CASE 
    WHEN auth.users.raw_user_meta_data->>'full_name' IS NOT NULL 
    THEN TRIM(SUBSTRING(
      auth.users.raw_user_meta_data->>'full_name' 
      FROM LENGTH(SPLIT_PART(auth.users.raw_user_meta_data->>'full_name', ' ', 1)) + 2
    ))
    ELSE profiles.last_name
  END
FROM auth.users
WHERE profiles.user_id = auth.users.id
  AND (auth.users.raw_user_meta_data->>'avatar_url' IS NOT NULL 
       OR auth.users.raw_user_meta_data->>'picture' IS NOT NULL);
\`\`\`

### Step 3: Test the Integration

1. **If you're a new user:**
   - Sign in with Google
   - Your profile should automatically have your Google avatar and name

2. **If you're an existing user:**
   - Follow Option A, B, or C above
   - Refresh the dashboard
   - Your Google profile picture should appear in the top-right corner

3. **Verify the profile:**
   - Go to `/profile-check` in your browser
   - Check that your profile has:
     - ✅ Correct first name and last name
     - ✅ Avatar URL populated
     - ✅ Email correct

## Troubleshooting

### Avatar Not Showing?

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for image loading errors
   - Google avatar URLs should look like: `https://lh3.googleusercontent.com/...`

2. **Verify Database:**
   - Go to Supabase Dashboard → Table Editor → profiles
   - Find your profile record
   - Check if `avatar_url` field has a value

3. **Check User Metadata:**
   - Go to Supabase Dashboard → Authentication → Users
   - Click on your user
   - Scroll to "User Metadata"
   - Look for `avatar_url` or `picture` field

### Name Not Showing Correctly?

1. Check the profile table to see what's stored
2. Verify Google provides `full_name` in metadata
3. If name is still wrong, you can manually edit it in the profiles table

## Features Now Working

✅ **Google Profile Image**: Automatically fetched and displayed in dashboard header  
✅ **Full Name Display**: Google full name is parsed and stored  
✅ **Fallback Avatar**: DiceBear avatar used if Google image unavailable  
✅ **Automatic Updates**: All future Google sign-ins will capture profile data  
✅ **Profile Functionality**: Profile creation and display working properly

## Next Steps

- The profile page functionality can be extended to allow users to edit their information
- Additional profile fields can be added (phone number, bio, etc.)
- Profile settings page can be created for user preferences

## Questions?

If you encounter any issues:
1. Check the browser console for errors
2. Verify the migration ran successfully in Supabase
3. Test with `/profile-check` page to see database state
4. Look at the auth state logs in the console
