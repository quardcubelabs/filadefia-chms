-- FIX STORAGE RLS - Run this in Supabase SQL Editor
-- This fixes "new row violates row-level security policy" when uploading member images

-- =============================================
-- STEP 1: Drop existing storage policies (if any)
-- =============================================
DROP POLICY IF EXISTS "member-photos_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "member-photos_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "member-photos_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "member-photos_delete_policy" ON storage.objects;

DROP POLICY IF EXISTS "profile-photos_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "profile-photos_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "profile-photos_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "profile-photos_delete_policy" ON storage.objects;

DROP POLICY IF EXISTS "photos_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "photos_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "photos_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "photos_delete_policy" ON storage.objects;

DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- =============================================
-- STEP 2: Create policies for member-photos bucket
-- =============================================

-- INSERT: Allow authenticated users to upload to member-photos
CREATE POLICY "member-photos_insert_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'member-photos');

-- SELECT: Allow public to view member-photos (images need to be publicly accessible)
CREATE POLICY "member-photos_select_policy" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'member-photos');

-- UPDATE: Allow authenticated users to update files in member-photos
CREATE POLICY "member-photos_update_policy" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'member-photos')
WITH CHECK (bucket_id = 'member-photos');

-- DELETE: Allow authenticated users to delete files in member-photos
CREATE POLICY "member-photos_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'member-photos');

-- =============================================
-- STEP 3: Create policies for profile-photos bucket
-- =============================================

-- INSERT: Allow authenticated users to upload to profile-photos
CREATE POLICY "profile-photos_insert_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-photos');

-- SELECT: Allow public to view profile-photos
CREATE POLICY "profile-photos_select_policy" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'profile-photos');

-- UPDATE: Allow authenticated users to update files in profile-photos
CREATE POLICY "profile-photos_update_policy" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'profile-photos')
WITH CHECK (bucket_id = 'profile-photos');

-- DELETE: Allow authenticated users to delete files in profile-photos
CREATE POLICY "profile-photos_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'profile-photos');

-- =============================================
-- STEP 4: Create policies for photos bucket (general)
-- =============================================

-- INSERT: Allow authenticated users to upload to photos
CREATE POLICY "photos_insert_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'photos');

-- SELECT: Allow public to view photos
CREATE POLICY "photos_select_policy" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'photos');

-- UPDATE: Allow authenticated users to update files in photos
CREATE POLICY "photos_update_policy" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'photos')
WITH CHECK (bucket_id = 'photos');

-- DELETE: Allow authenticated users to delete files in photos
CREATE POLICY "photos_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'photos');

-- =============================================
-- STEP 5: Verify policies are created
-- =============================================
SELECT 
  policyname, 
  tablename, 
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;
