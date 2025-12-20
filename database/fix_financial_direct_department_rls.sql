-- Temporary direct fix for financial transactions department filtering
-- This bypasses complex department_members checks and uses direct department leadership

-- Drop all existing policies
DROP POLICY IF EXISTS "financial_transactions_select_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete_policy" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_select_authenticated" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert_authenticated" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update_authenticated" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete_authenticated" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_all_access" ON financial_transactions;

-- Create simple department-based SELECT policy
CREATE POLICY "financial_transactions_department_select" ON financial_transactions 
  FOR SELECT 
  TO authenticated
  USING (
    -- Administrators and pastors can see all
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Secretaries and treasurers can see all
    auth.jwt() ->> 'role' IN ('secretary', 'treasurer') OR
    -- Department leaders can only see their department's transactions
    (
      auth.jwt() ->> 'role' = 'department_leader' AND
      (
        department_id IS NULL OR
        department_id IN (
          -- Direct check: departments where this user is the leader
          SELECT d.id 
          FROM departments d
          JOIN members m ON d.leader_id = m.id
          WHERE m.email = auth.jwt() ->> 'email'
          AND d.is_active = true
        )
      )
    ) OR
    -- Users can see transactions they recorded
    recorded_by = (auth.jwt() ->> 'sub')::uuid
  );

-- Create INSERT policy (same logic)
CREATE POLICY "financial_transactions_department_insert" ON financial_transactions 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Administrators and pastors can create for any department
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Secretaries and treasurers can create transactions
    auth.jwt() ->> 'role' IN ('secretary', 'treasurer') OR
    -- Department leaders can create for their department or no department
    (
      auth.jwt() ->> 'role' = 'department_leader' AND
      (
        department_id IS NULL OR
        department_id IN (
          SELECT d.id 
          FROM departments d
          JOIN members m ON d.leader_id = m.id
          WHERE m.email = auth.jwt() ->> 'email'
          AND d.is_active = true
        )
      )
    )
  );

-- Create UPDATE policy
CREATE POLICY "financial_transactions_department_update" ON financial_transactions 
  FOR UPDATE 
  TO authenticated
  USING (
    -- Administrators and pastors can update all
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Secretaries and treasurers can update all
    auth.jwt() ->> 'role' IN ('secretary', 'treasurer') OR
    -- Users can update transactions they recorded
    recorded_by = (auth.jwt() ->> 'sub')::uuid OR
    -- Department leaders can update their department's transactions
    (
      auth.jwt() ->> 'role' = 'department_leader' AND
      (
        department_id IS NULL OR
        department_id IN (
          SELECT d.id 
          FROM departments d
          JOIN members m ON d.leader_id = m.id
          WHERE m.email = auth.jwt() ->> 'email'
          AND d.is_active = true
        )
      )
    )
  )
  WITH CHECK (
    -- Same conditions
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    auth.jwt() ->> 'role' IN ('secretary', 'treasurer') OR
    recorded_by = (auth.jwt() ->> 'sub')::uuid OR
    (
      auth.jwt() ->> 'role' = 'department_leader' AND
      (
        department_id IS NULL OR
        department_id IN (
          SELECT d.id 
          FROM departments d
          JOIN members m ON d.leader_id = m.id
          WHERE m.email = auth.jwt() ->> 'email'
          AND d.is_active = true
        )
      )
    )
  );

-- Create DELETE policy (admins only)
CREATE POLICY "financial_transactions_department_delete" ON financial_transactions 
  FOR DELETE 
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('administrator', 'pastor')
  );

-- Enable RLS and grant permissions
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON financial_transactions TO authenticated;
GRANT DELETE ON financial_transactions TO authenticated;

-- Test query to verify what the policy will find for your user
-- Replace 'mwakabonga_fcc@gmail.com' with your actual email
SELECT 
    'RLS Test - Departments you can access' as test_type,
    d.id as department_id,
    d.name as department_name,
    'Financial transactions with this department_id will be visible' as note
FROM departments d
JOIN members m ON d.leader_id = m.id
WHERE m.email = 'mwakabonga_fcc@gmail.com'  -- Replace with your email
  AND d.is_active = true;