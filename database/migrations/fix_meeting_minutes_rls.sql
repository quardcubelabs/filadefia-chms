-- Fix meeting_minutes RLS policies to allow department leaders to create records

-- Drop existing policies
DROP POLICY IF EXISTS "meeting_minutes_all_access" ON meeting_minutes;
DROP POLICY IF EXISTS "meeting_minutes_select_all" ON meeting_minutes;
DROP POLICY IF EXISTS "meeting_minutes_modify_leaders" ON meeting_minutes;

-- Temporary: Create a permissive policy for troubleshooting
-- This allows all department leaders to create meeting minutes
-- TODO: Replace with more restrictive policy once department assignments are verified
CREATE POLICY "meeting_minutes_temp_department_leaders" ON meeting_minutes 
  FOR ALL 
  TO authenticated
  USING (
    -- Administrators and pastors have full access
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Department leaders have access to all (temporary)
    auth.jwt() ->> 'role' = 'department_leader' OR
    -- Secretaries have access
    auth.jwt() ->> 'role' = 'secretary' OR
    -- Users can access records they created
    recorded_by = (auth.jwt() ->> 'sub')::uuid
  )
  WITH CHECK (
    -- Same conditions for insert/update
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    auth.jwt() ->> 'role' = 'department_leader' OR
    auth.jwt() ->> 'role' = 'secretary' OR
    recorded_by = (auth.jwt() ->> 'sub')::uuid
  );

-- Create comprehensive policies for meeting_minutes (commented out for now)

/*
-- Allow everyone to view meeting minutes (admins see all, department leaders see their department)
CREATE POLICY "meeting_minutes_select_policy" ON meeting_minutes 
  FOR SELECT 
  TO authenticated
  USING (
    -- Administrators and pastors can see all
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Other staff can see minutes they recorded
    recorded_by = (auth.jwt() ->> 'sub')::uuid OR
    -- Department leaders can see their department's minutes (new structure)
    (
      auth.jwt() ->> 'role' = 'department_leader' AND
      department_id IN (
        SELECT id 
        FROM departments 
        WHERE leader_user_id = (auth.jwt() ->> 'sub')::uuid
        AND is_active = true
      )
    ) OR
    -- Department leaders can see their department's minutes (old structure via member email)
    (
      auth.jwt() ->> 'role' = 'department_leader' AND
      department_id IN (
        SELECT department_id 
        FROM department_members dm
        JOIN members m ON dm.member_id = m.id 
        WHERE m.email = auth.jwt() ->> 'email'
        AND dm.is_active = true
      )
    ) OR
    -- Department leaders can see departments they lead (via departments.leader_id)
    (
      auth.jwt() ->> 'role' = 'department_leader' AND
      department_id IN (
        SELECT d.id 
        FROM departments d
        JOIN members m ON d.leader_id = m.id 
        WHERE m.email = auth.jwt() ->> 'email'
        AND d.is_active = true
      )
    )
  );

-- Allow department leaders to insert meeting minutes for their department
CREATE POLICY "meeting_minutes_insert_policy" ON meeting_minutes 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Administrators and pastors can create for any department
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Secretaries can create meeting minutes
    auth.jwt() ->> 'role' = 'secretary' OR
    -- Department leaders can create for their department (new structure using leader_user_id)
    (
      auth.jwt() ->> 'role' = 'department_leader' AND
      department_id IN (
        SELECT id 
        FROM departments 
        WHERE leader_user_id = (auth.jwt() ->> 'sub')::uuid
        AND is_active = true
      )
    ) OR
    -- Department leaders can create for their department (old structure via member email)
    (
      auth.jwt() ->> 'role' = 'department_leader' AND
      department_id IN (
        SELECT department_id 
        FROM department_members dm
        JOIN members m ON dm.member_id = m.id 
        WHERE m.email = auth.jwt() ->> 'email'
        AND dm.is_active = true
      )
    ) OR
    -- Department leaders can create for departments they lead (via departments.leader_id)
    (
      auth.jwt() ->> 'role' = 'department_leader' AND
      department_id IN (
        SELECT d.id 
        FROM departments d
        JOIN members m ON d.leader_id = m.id 
        WHERE m.email = auth.jwt() ->> 'email'
        AND d.is_active = true
      )
    )
  );

-- Allow users to update meeting minutes they created or for their department
CREATE POLICY "meeting_minutes_update_policy" ON meeting_minutes 
  FOR UPDATE 
  TO authenticated
  USING (
    -- Administrators and pastors can update all
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Users can update minutes they recorded
    recorded_by = (auth.jwt() ->> 'sub')::uuid OR
    -- Department leaders can update their department's minutes
    (
      auth.jwt() ->> 'role' = 'department_leader' AND
      department_id IN (
        SELECT department_id 
        FROM department_members dm
        JOIN members m ON dm.member_id = m.id 
        WHERE m.email = auth.jwt() ->> 'email'
      )
    )
  )
  WITH CHECK (
    -- Same conditions as USING clause
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    recorded_by = (auth.jwt() ->> 'sub')::uuid OR
    (
      auth.jwt() ->> 'role' = 'department_leader' AND
      department_id IN (
        SELECT department_id 
        FROM department_members dm
        JOIN members m ON dm.member_id = m.id 
        WHERE m.email = auth.jwt() ->> 'email'
      )
    )
  );

-- Allow deletion by administrators and pastors
CREATE POLICY "meeting_minutes_delete_policy" ON meeting_minutes 
  FOR DELETE 
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('administrator', 'pastor')
  );

-- Enable RLS (should already be enabled)
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON meeting_minutes TO authenticated;
GRANT DELETE ON meeting_minutes TO authenticated;