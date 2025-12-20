-- Simple Financial RLS Fix
-- Run this in your Supabase SQL Editor to fix financial transactions RLS issues

-- First, check what's currently there
SELECT COUNT(*) as transaction_count FROM financial_transactions;

-- Remove all existing policies on financial_transactions
DROP POLICY IF EXISTS "financial_transactions_all_access" ON financial_transactions;
DROP POLICY IF EXISTS "financial_all_access" ON financial_transactions;
DROP POLICY IF EXISTS "financial_select_staff" ON financial_transactions;
DROP POLICY IF EXISTS "financial_modify_treasurer" ON financial_transactions;
DROP POLICY IF EXISTS "Authenticated users can view financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Staff can insert financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Staff can update financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Admins can delete financial transactions" ON financial_transactions;

-- Create a single, simple policy for all authenticated users
CREATE POLICY "allow_all_authenticated_financial" ON financial_transactions
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Make sure RLS is enabled
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Test the fix by checking data access
SELECT 
  COUNT(*) as total_transactions,
  MAX(created_at) as latest_transaction
FROM financial_transactions;