-- Simple fix for departments access
-- Run these commands one by one in Supabase SQL Editor

-- Step 1: Create the function to get departments
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

-- Step 2: Grant permissions to the function
GRANT EXECUTE ON FUNCTION get_departments() TO service_role;
GRANT EXECUTE ON FUNCTION get_departments() TO authenticated;

-- Step 3: Test the function
SELECT * FROM get_departments();