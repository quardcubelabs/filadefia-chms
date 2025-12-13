-- IMMEDIATE FIX: Storage RLS Policies for Photo Upload
-- Run this in your Supabase SQL Editor

-- Step 1: Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all photos" ON storage.objects; 
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Staff can manage all photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view photos" ON storage.objects;

-- Step 3: Create permissive policies for photo upload
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

-- Step 4: Ensure profiles can be updated
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

SELECT 'Storage RLS policies created successfully!' as result;