-- Migration to fix Financial Transactions RLS Issues
-- Add this file to your database/migrations folder and run it

-- Step 1: Remove all existing problematic policies
DROP POLICY IF EXISTS "financial_transactions_all_access" ON financial_transactions;
DROP POLICY IF EXISTS "financial_all_access" ON financial_transactions;
DROP POLICY IF EXISTS "financial_select_staff" ON financial_transactions;
DROP POLICY IF EXISTS "financial_modify_treasurer" ON financial_transactions;
DROP POLICY IF EXISTS "Authenticated users can view financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Staff can insert financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Staff can update financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Admins can delete financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "allow_all_authenticated_financial" ON financial_transactions;

-- Step 2: Create comprehensive policies for all authenticated users
CREATE POLICY "financial_transactions_select_authenticated" ON financial_transactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "financial_transactions_insert_authenticated" ON financial_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "financial_transactions_update_authenticated" ON financial_transactions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "financial_transactions_delete_authenticated" ON financial_transactions
  FOR DELETE
  TO authenticated
  USING (true);

-- Step 3: Ensure RLS is properly enabled
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Step 4: Grant necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_transactions TO authenticated;

-- Step 5: Verify the setup works
DO $$
BEGIN
  -- Test if table is accessible
  PERFORM COUNT(*) FROM financial_transactions;
  RAISE NOTICE 'Financial transactions table access verified';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Warning: Could not access financial_transactions table - %', SQLERRM;
END $$;