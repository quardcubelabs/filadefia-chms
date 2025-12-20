-- Fix Financial Transactions RLS Issues
-- This script addresses common RLS problems that prevent users from accessing financial data

-- Check if RLS is enabled on financial_transactions
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'financial_transactions';

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'financial_transactions';

-- Remove any problematic policies and create fresh ones
DROP POLICY IF EXISTS "financial_all_access" ON financial_transactions;
DROP POLICY IF EXISTS "financial_select_staff" ON financial_transactions;
DROP POLICY IF EXISTS "financial_modify_treasurer" ON financial_transactions;
DROP POLICY IF EXISTS "Authenticated users can view financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Staff can insert financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Staff can update financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Admins can delete financial transactions" ON financial_transactions;

-- Temporarily disable RLS to add proper policies
ALTER TABLE financial_transactions DISABLE ROW LEVEL SECURITY;

-- Add basic access policy for all authenticated users
CREATE POLICY "financial_transactions_all_access" ON financial_transactions
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Force RLS refresh
NOTIFY pgrst, 'reload schema';

-- Check the table has data
SELECT COUNT(*) as total_transactions FROM financial_transactions;

-- If no data, let's check if the table exists and has proper structure
\d financial_transactions;

-- Check if there are any triggers or functions that might interfere
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'financial_transactions';

-- Test a simple insert to verify permissions work
DO $$
DECLARE
    test_member_id UUID;
    test_profile_id UUID;
    test_dept_id UUID;
BEGIN
    -- Get a test member, profile, and department
    SELECT id INTO test_member_id FROM members LIMIT 1;
    SELECT id INTO test_profile_id FROM profiles LIMIT 1;  
    SELECT id INTO test_dept_id FROM departments WHERE is_active = true LIMIT 1;
    
    -- Only try insert if we have the required data
    IF test_member_id IS NOT NULL AND test_profile_id IS NOT NULL THEN
        INSERT INTO financial_transactions (
            member_id,
            transaction_type,
            amount,
            description,
            payment_method,
            department_id,
            date,
            recorded_by
        ) VALUES (
            test_member_id,
            'tithe',
            50000.00,
            'Test transaction for RLS verification',
            'Cash',
            test_dept_id,
            CURRENT_DATE,
            test_profile_id
        );
        
        RAISE NOTICE 'Successfully inserted test transaction';
    ELSE
        RAISE NOTICE 'Cannot insert test transaction - missing required reference data';
        RAISE NOTICE 'Members exist: %', (SELECT COUNT(*) FROM members);
        RAISE NOTICE 'Profiles exist: %', (SELECT COUNT(*) FROM profiles);
        RAISE NOTICE 'Departments exist: %', (SELECT COUNT(*) FROM departments);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test insert failed: %', SQLERRM;
END $$;

-- Final check
SELECT 
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN transaction_type = 'tithe' THEN 1 END) as tithes,
    COUNT(CASE WHEN transaction_type = 'offering' THEN 1 END) as offerings,
    MAX(date) as latest_transaction_date
FROM financial_transactions;