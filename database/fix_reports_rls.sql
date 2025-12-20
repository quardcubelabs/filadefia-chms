-- Fix reports RLS policies to allow department leaders to create reports

-- Drop existing policies
DROP POLICY IF EXISTS "reports_all_access" ON reports;
DROP POLICY IF EXISTS "reports_select_staff" ON reports;
DROP POLICY IF EXISTS "reports_insert_staff" ON reports;

-- Create comprehensive policies for reports
CREATE POLICY "reports_select_policy" ON reports 
  FOR SELECT 
  TO authenticated
  USING (
    -- Administrators and pastors can see all reports
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Users can see reports they generated
    generated_by = (auth.jwt() ->> 'sub')::uuid OR
    -- Department leaders can see their department's reports
    (
      auth.jwt() ->> 'role' = 'department_leader' AND
      department_id IN (
        SELECT department_id 
        FROM department_members dm
        JOIN members m ON dm.member_id = m.id 
        WHERE m.email = auth.jwt() ->> 'email'
        AND dm.is_active = true
      )
    )
  );

-- Allow department leaders and staff to create reports
CREATE POLICY "reports_insert_policy" ON reports 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Administrators and pastors can create reports for any department
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Secretaries can create reports
    auth.jwt() ->> 'role' = 'secretary' OR
    -- Department leaders can create reports for their department
    (
      auth.jwt() ->> 'role' = 'department_leader' AND
      (
        department_id IS NULL OR
        department_id IN (
          SELECT department_id 
          FROM department_members dm
          JOIN members m ON dm.member_id = m.id 
          WHERE m.email = auth.jwt() ->> 'email'
          AND dm.is_active = true
        )
      )
    )
  );

-- Allow users to update reports they generated
CREATE POLICY "reports_update_policy" ON reports 
  FOR UPDATE 
  TO authenticated
  USING (
    -- Administrators and pastors can update all reports
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Users can update reports they generated
    generated_by = (auth.jwt() ->> 'sub')::uuid
  )
  WITH CHECK (
    -- Same conditions as USING clause
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    generated_by = (auth.jwt() ->> 'sub')::uuid
  );

-- Allow deletion by administrators and pastors only
CREATE POLICY "reports_delete_policy" ON reports 
  FOR DELETE 
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('administrator', 'pastor')
  );

-- Ensure RLS is enabled
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON reports TO authenticated;
GRANT DELETE ON reports TO authenticated;