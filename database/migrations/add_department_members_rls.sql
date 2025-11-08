-- Add RLS Policies for department_members table
-- This allows admins to manage member-department assignments

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin can view department_members" ON department_members;
DROP POLICY IF EXISTS "Admin can insert department_members" ON department_members;
DROP POLICY IF EXISTS "Admin can update department_members" ON department_members;
DROP POLICY IF EXISTS "Admin can delete department_members" ON department_members;

-- Allow admins to SELECT department_members
CREATE POLICY "Admin can view department_members" ON department_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('administrator', 'pastor', 'secretary', 'department_leader')
  )
);

-- Allow admins to INSERT department_members
CREATE POLICY "Admin can insert department_members" ON department_members FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('administrator', 'pastor', 'secretary')
  )
);

-- Allow admins to UPDATE department_members
CREATE POLICY "Admin can update department_members" ON department_members FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('administrator', 'pastor', 'secretary')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('administrator', 'pastor', 'secretary')
  )
);

-- Allow admins to DELETE department_members
CREATE POLICY "Admin can delete department_members" ON department_members FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('administrator', 'pastor', 'secretary')
  )
);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'department_members'
ORDER BY policyname;
