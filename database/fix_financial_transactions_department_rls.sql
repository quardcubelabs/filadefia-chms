-- Fix financial_transactions RLS policies for proper department filtering
-- This ensures department leaders only see their department's transactions at the database level

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "financial_transactions_select_authenticated" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_insert_authenticated" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_update_authenticated" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_delete_authenticated" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_all_access" ON financial_transactions;

-- Create department-aware SELECT policy
CREATE POLICY "financial_transactions_select_policy" ON financial_transactions 
  FOR SELECT 
  TO authenticated
  USING (
    -- Administrators and pastors can see all transactions
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Secretaries and treasurers can see all transactions
    auth.jwt() ->> 'role' IN ('secretary', 'treasurer') OR
    -- Department leaders can see transactions for their department(s)
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
    ) OR
    -- Users can see transactions they recorded
    recorded_by = (auth.jwt() ->> 'sub')::uuid
  );

-- Create INSERT policy
CREATE POLICY "financial_transactions_insert_policy" ON financial_transactions 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Administrators and pastors can create transactions for any department
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Secretaries and treasurers can create transactions
    auth.jwt() ->> 'role' IN ('secretary', 'treasurer') OR
    -- Department leaders can create transactions for their department or no department
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

-- Create UPDATE policy
CREATE POLICY "financial_transactions_update_policy" ON financial_transactions 
  FOR UPDATE 
  TO authenticated
  USING (
    -- Administrators and pastors can update all transactions
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    -- Secretaries and treasurers can update transactions
    auth.jwt() ->> 'role' IN ('secretary', 'treasurer') OR
    -- Users can update transactions they recorded
    recorded_by = (auth.jwt() ->> 'sub')::uuid OR
    -- Department leaders can update transactions in their department
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
  )
  WITH CHECK (
    -- Same conditions as USING clause
    auth.jwt() ->> 'role' IN ('administrator', 'pastor') OR
    auth.jwt() ->> 'role' IN ('secretary', 'treasurer') OR
    recorded_by = (auth.jwt() ->> 'sub')::uuid OR
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

-- Create DELETE policy (restricted to admins only)
CREATE POLICY "financial_transactions_delete_policy" ON financial_transactions 
  FOR DELETE 
  TO authenticated
  USING (
    auth.jwt() ->> 'role' IN ('administrator', 'pastor')
  );

-- Ensure RLS is enabled
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON financial_transactions TO authenticated;
GRANT DELETE ON financial_transactions TO authenticated;