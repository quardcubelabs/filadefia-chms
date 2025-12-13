-- Fix Storage RLS Policies for Photo Uploads
-- This migration sets up proper storage bucket policies for department leaders

-- First, ensure the storage buckets exist
-- Note: This SQL runs in the database context, not the storage API
-- You may need to create buckets manually in Supabase Dashboard

-- Create RLS policies for storage.objects table (this controls file access)
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

-- Policy 1: Allow authenticated users to upload to photos bucket
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'photos' OR 
    bucket_id = 'member-photos' OR 
    bucket_id = 'profile-photos'
  );

-- Policy 2: Allow authenticated users to view all photos
CREATE POLICY "Authenticated users can view photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'photos' OR 
    bucket_id = 'member-photos' OR 
    bucket_id = 'profile-photos'
  );

-- Policy 3: Allow users to update their own uploaded photos
CREATE POLICY "Users can update their own photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    (bucket_id = 'photos' OR bucket_id = 'member-photos' OR bucket_id = 'profile-photos') AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    (bucket_id = 'photos' OR bucket_id = 'member-photos' OR bucket_id = 'profile-photos') AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 4: Allow users to delete their own photos
CREATE POLICY "Users can delete their own photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    (bucket_id = 'photos' OR bucket_id = 'member-photos' OR bucket_id = 'profile-photos') AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 5: Allow staff to manage all photos
CREATE POLICY "Staff can manage all photos" ON storage.objects
  FOR ALL TO authenticated
  USING (
    (bucket_id = 'photos' OR bucket_id = 'member-photos' OR bucket_id = 'profile-photos') AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'pastor', 'secretary', 'treasurer', 'department_leader')
      AND p.is_active = true
    )
  )
  WITH CHECK (
    (bucket_id = 'photos' OR bucket_id = 'member-photos' OR bucket_id = 'profile-photos') AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'pastor', 'secretary', 'treasurer', 'department_leader')
      AND p.is_active = true
    )
  );

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Also need to ensure profiles table allows department leaders to update their photo_url
-- Update the existing profile policies to be more permissive for photo updates

-- Drop and recreate profile update policy to allow photo_url updates
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add a specific policy for staff to update member photos via profiles
CREATE POLICY "staff_can_update_profiles" ON profiles 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'pastor', 'secretary', 'treasurer', 'department_leader')
      AND p.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'pastor', 'secretary', 'treasurer', 'department_leader')
      AND p.is_active = true
    )
  );

-- Verification queries
SELECT 'Storage RLS Policies Created' as status;

-- Check if storage.objects policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- Instructions for manual bucket creation
SELECT 'MANUAL STEPS REQUIRED:' as notice,
       'You need to create these buckets in Supabase Dashboard > Storage:' as instruction,
       '1. photos (public: true)' as step1,
       '2. member-photos (public: true)' as step2, 
       '3. profile-photos (public: true)' as step3;