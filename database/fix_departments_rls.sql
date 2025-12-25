-- Fix departments RLS access for service role
-- This ensures the departments API works properly

-- First, let's check if the service role can access departments
SELECT 
  CASE 
    WHEN current_setting('role') = 'service_role' THEN 'Using service_role - should bypass RLS'
    ELSE 'Not using service_role - RLS may apply'
  END as role_status;

-- Create a function that service role can use to get departments
-- This function runs with SECURITY DEFINER so it bypasses RLS
CREATE OR REPLACE FUNCTION get_departments()
RETURNS TABLE (
  id UUID,
  name TEXT,
  swahili_name TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.name, d.swahili_name
  FROM departments d
  WHERE d.is_active = true
  ORDER BY d.name ASC;
END;
$$;

-- Grant execute permission to service_role and authenticated users
GRANT EXECUTE ON FUNCTION get_departments() TO service_role;
GRANT EXECUTE ON FUNCTION get_departments() TO authenticated;

-- Also ensure service_role can directly access departments table (it should by default)
-- Service role should bypass RLS, but let's be explicit
CREATE POLICY IF NOT EXISTS "service_role_departments_access" 
ON departments 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Verify the function works
SELECT * FROM get_departments();

-- Show current policies on departments table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'departments';