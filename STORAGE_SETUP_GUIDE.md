# Storage Permission Fix - Complete Guide

## Problem
Department leaders get "new row violates row-level security policy" when uploading photos because:
1. Storage buckets don't exist
2. Storage bucket policies are restrictive
3. Only service role can modify `storage.objects` policies via SQL

## Solution: Manual Bucket Setup (Required)

### Step 1: Create Storage Buckets
**In Supabase Dashboard > Storage:**

1. Click "Create a new bucket"
2. Create these buckets with these exact settings:

**Bucket 1: photos**
- Name: `photos`
- Public bucket: ✅ **CHECKED**
- Allowed MIME types: `image/*`

**Bucket 2: profile-photos** 
- Name: `profile-photos`
- Public bucket: ✅ **CHECKED**
- Allowed MIME types: `image/*`

**Bucket 3: member-photos**
- Name: `member-photos` 
- Public bucket: ✅ **CHECKED**
- Allowed MIME types: `image/*`

### Step 2: Set Bucket Policies (Manual)
For each bucket created above:

1. Click on the bucket name
2. Go to "Policies" tab
3. Click "Add policy"
4. Create these policies:

**Policy 1: Upload Policy**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'BUCKET_NAME_HERE');
```

**Policy 2: Read Policy**
```sql  
-- Allow public read access
CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'BUCKET_NAME_HERE');
```

**Policy 3: Update Policy**
```sql
-- Allow users to update their files
CREATE POLICY "Allow authenticated updates" ON storage.objects
FOR UPDATE TO authenticated  
USING (bucket_id = 'BUCKET_NAME_HERE')
WITH CHECK (bucket_id = 'BUCKET_NAME_HERE');
```

**Policy 4: Delete Policy**
```sql
-- Allow users to delete their files  
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'BUCKET_NAME_HERE');
```

Replace `BUCKET_NAME_HERE` with: `photos`, `profile-photos`, and `member-photos` respectively.

### Step 3: Run Profile Permission Fix
**Run this SQL in Supabase SQL Editor:**

```sql
-- Fix profile table permissions
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "authenticated_can_update_profiles" ON profiles;
DROP POLICY IF EXISTS "staff_can_update_profiles" ON profiles;

CREATE POLICY "profiles_comprehensive_update" ON profiles 
  FOR UPDATE TO authenticated 
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'pastor', 'secretary', 'treasurer', 'department_leader')
      AND p.is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'pastor', 'secretary', 'treasurer', 'department_leader')
      AND p.is_active = true
    )
  );
```

### Step 4: Alternative - Quick Bucket Setup
If manual policy creation is complex, you can:

1. **Make buckets public** (easiest option)
2. **Disable RLS** on storage.objects (less secure but works)

**To disable storage RLS (temporary fix):**
```sql
-- WARNING: This makes all storage public - use only for testing
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

## Verification Steps

1. **Check buckets exist:**
   - Go to Supabase Dashboard > Storage
   - Verify `photos`, `profile-photos`, `member-photos` exist
   - Verify they are marked as "Public"

2. **Test upload:**
   - Log in as department leader
   - Go to Settings or Dashboard
   - Try uploading a profile photo
   - Check browser console for detailed logs

3. **Check policies:**
   ```sql
   -- Verify storage policies
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
   
   -- Verify profile policies  
   SELECT * FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public';
   ```

## Troubleshooting

**If upload still fails:**
1. **Check bucket exists:** Dashboard > Storage
2. **Verify bucket is public:** Bucket settings
3. **Check user role:** Ensure user has `department_leader` role
4. **Browser console:** Look for specific error details
5. **Try different bucket:** App now tries multiple buckets automatically

**Common issues:**
- Bucket doesn't exist → Create manually
- Bucket not public → Check "Public bucket" setting  
- Wrong bucket name → Verify exact spelling
- No upload policy → Add policies manually or disable RLS

## Files Modified
- `database/migrations/fix_profile_permissions.sql` - Profile table permissions
- `src/app/dashboard/page.tsx` - Multi-bucket upload fallback
- Enhanced error handling and logging throughout

## Security Note
Making buckets public allows anyone to read uploaded images, but only authenticated users can upload. This is typical for profile photos and member images in most applications.