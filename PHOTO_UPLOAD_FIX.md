# Fix Department Leader Photo Upload Issue

## Problem
Department leaders are getting "new row violates row-level security policy" error when uploading photos.

## Root Cause
The storage buckets either don't exist or don't have proper RLS (Row Level Security) policies allowing department leaders to upload files.

## Solution Steps

### Step 1: Run SQL Migration
Execute the SQL script: `database/migrations/quick_fix_storage_upload.sql`

**In Supabase Dashboard > SQL Editor, run:**
```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all photos" ON storage.objects; 
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff can manage all photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view photos" ON storage.objects;

-- Create permissive policies for photo upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('photos', 'member-photos', 'profile-photos')
  );

CREATE POLICY "Allow authenticated reads" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('photos', 'member-photos', 'profile-photos')
  );

CREATE POLICY "Allow authenticated updates" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('photos', 'member-photos', 'profile-photos')
  )
  WITH CHECK (
    bucket_id IN ('photos', 'member-photos', 'profile-photos')
  );

CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('photos', 'member-photos', 'profile-photos')
  );

-- Ensure profiles can be updated
DROP POLICY IF EXISTS "staff_can_update_profiles" ON profiles;
CREATE POLICY "authenticated_can_update_profiles" ON profiles 
  FOR UPDATE TO authenticated 
  USING (
    -- Users can update their own profile OR staff can update any profile
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'pastor', 'secretary', 'treasurer', 'department_leader')
      AND p.is_active = true
    )
  );
```

### Step 2: Create Storage Buckets
In Supabase Dashboard > Storage, create these buckets if they don't exist:

1. **photos** (Public: ✅ Checked)
2. **member-photos** (Public: ✅ Checked)
3. **profile-photos** (Public: ✅ Checked)

### Step 3: Verify Bucket Policies
In each bucket settings, ensure these policies exist:
- Allow authenticated users to upload
- Allow public read access
- Allow authenticated users to update/delete their own files

### Step 4: Test Upload
1. Log in as a department leader
2. Go to Settings > Profile or Dashboard
3. Try uploading a photo
4. Check browser console for detailed error logs

## Verification
After applying the fix:
- Department leaders should be able to upload photos without RLS errors
- Photos should be publicly accessible via the generated URLs
- Profile photos should update successfully in the database

## Troubleshooting
If the issue persists:
1. Check browser console for specific error details
2. Verify the user has `department_leader` role in the profiles table
3. Ensure the storage bucket exists and is public
4. Check that RLS policies are correctly applied in SQL Editor

## Files Modified
- `src/app/dashboard/page.tsx` - Enhanced error handling
- `src/app/settings/page.tsx` - Enhanced error handling and correct table updates
- `database/migrations/quick_fix_storage_upload.sql` - RLS policies fix