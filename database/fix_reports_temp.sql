-- Temporary permissive fix for reports - allows all department leaders to create reports
-- This removes the complex department membership checks that are causing issues

-- Drop all existing policies
DROP POLICY IF EXISTS "reports_all_access" ON reports;
DROP POLICY IF EXISTS "reports_select_policy" ON reports;
DROP POLICY IF EXISTS "reports_insert_policy" ON reports;
DROP POLICY IF EXISTS "reports_update_policy" ON reports;
DROP POLICY IF EXISTS "reports_delete_policy" ON reports;

-- Create simple, permissive policy for department leaders
CREATE POLICY "reports_temp_department_leaders" ON reports 
  FOR ALL 
  TO authenticated
  USING (
    -- Administrators and pastors have full access
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Department leaders have access to all (temporary)
    auth.jwt() ->> 'role' = 'department_leader' OR
    -- Secretaries have access
    auth.jwt() ->> 'role' = 'secretary' OR
    -- Users can access reports they generated
    generated_by = (auth.jwt() ->> 'sub')::uuid
  )
  WITH CHECK (
    -- Same conditions for insert/update
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    auth.jwt() ->> 'role' = 'department_leader' OR
    auth.jwt() ->> 'role' = 'secretary' OR
    generated_by = (auth.jwt() ->> 'sub')::uuid
  );

-- Ensure RLS is enabled
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON reports TO authenticated;