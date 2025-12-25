-- Add service_role access policy to departments table
-- This preserves all existing RLS policies while allowing service_role access

-- Check current policies before adding new one
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'departments'
ORDER BY policyname;

-- Add service_role policy for departments access
-- Service role needs full access to departments for API operations
CREATE POLICY "service_role_full_access" 
ON departments 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Verify the new policy was created
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'departments'
AND policyname = 'service_role_full_access';

-- Test access with a simple query
-- This should now work for service_role
SELECT id, name, swahili_name 
FROM departments 
WHERE is_active = true 
ORDER BY name 
LIMIT 5;