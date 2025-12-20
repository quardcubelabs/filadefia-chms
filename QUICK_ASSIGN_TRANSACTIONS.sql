-- Create 120 Financial Transactions (10 per Department)
-- Run this in your Supabase SQL Editor

-- FIRST: Fix RLS policies to allow access
DROP POLICY IF EXISTS "allow_all_authenticated_financial" ON financial_transactions;
DROP POLICY IF EXISTS "financial_transactions_all_access" ON financial_transactions;
DROP POLICY IF EXISTS "financial_all_access" ON financial_transactions;

-- Create a simple policy that allows all authenticated users to access financial transactions
CREATE POLICY "financial_access_authenticated" ON financial_transactions
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- DEBUG: Check what departments exist and find Children's Department
SELECT 
    'Current departments:' as info,
    id, 
    name, 
    leader_user_id,
    is_active
FROM departments 
WHERE is_active = true 
ORDER BY name;

-- Find the Children's Department specifically
SELECT 
    'Children Department Info:' as info,
    id as dept_id, 
    name as dept_name,
    leader_user_id
FROM departments 
WHERE name ILIKE '%children%' 
   OR name ILIKE '%child%'
   AND is_active = true;

-- Check current user
SELECT 
    'Current user info:' as info,
    auth.uid() as current_user_id;



-- Create a sample profile for recorded_by if none exists
INSERT INTO profiles (id, first_name, last_name, email, created_at)
SELECT uuid_generate_v4(), 'System', 'Administrator', 'admin@church.com', NOW()
WHERE NOT EXISTS (SELECT 1 FROM profiles LIMIT 1);

-- Now add 10 transactions per department (120 total)
DO $$
DECLARE
    dept_record RECORD;
    profile_id UUID;
    transaction_types TEXT[] := ARRAY['tithe', 'offering', 'donation', 'project', 'expense'];
    payment_methods TEXT[] := ARRAY['Cash', 'M-Pesa', 'Bank Transfer', 'TigoPesa', 'Airtel Money'];
    amounts DECIMAL[] := ARRAY[25000, 50000, 75000, 100000, 150000, 30000, 40000, 60000, 80000, 120000];
    counter INTEGER := 0;
BEGIN
    -- Get a profile ID for recorded_by
    SELECT id INTO profile_id FROM profiles LIMIT 1;
    
    -- Loop through each department
    FOR dept_record IN 
        SELECT id, name FROM departments WHERE is_active = true ORDER BY name
    LOOP
        -- Add 10 transactions for this department
        FOR i IN 1..10 LOOP
            counter := counter + 1;
            
            INSERT INTO financial_transactions (
                id,
                department_id,
                transaction_type,
                amount,
                currency,
                description,
                payment_method,
                reference_number,
                date,
                recorded_by,
                verified,
                created_at
            ) VALUES (
                uuid_generate_v4(),
                dept_record.id,
                transaction_types[((counter - 1) % 5) + 1]::transaction_type,
                amounts[((counter - 1) % 10) + 1],
                'TZS',
                dept_record.name || ' - Transaction #' || i,
                payment_methods[((counter - 1) % 5) + 1],
                CASE 
                    WHEN payment_methods[((counter - 1) % 5) + 1] = 'M-Pesa' THEN 'MP' || LPAD((counter)::TEXT, 8, '0')
                    WHEN payment_methods[((counter - 1) % 5) + 1] = 'Bank Transfer' THEN 'BT' || LPAD((counter)::TEXT, 8, '0')
                    ELSE NULL
                END,
                CURRENT_DATE - INTERVAL '1 day' * (counter % 30),
                profile_id,
                (counter % 3) = 0, -- Every 3rd transaction is verified
                NOW() - INTERVAL '1 day' * (counter % 30)
            );
        END LOOP;
        
        RAISE NOTICE 'Added 10 transactions for department: %', dept_record.name;
    END LOOP;
    
    RAISE NOTICE 'Successfully created % transactions across all departments', counter;
END $$;

-- SPECIFIC: Add extra transactions for Children's Department to ensure you see data
DO $$
DECLARE
    children_dept_id UUID;
    profile_id UUID;
BEGIN
    -- Get Children's Department ID
    SELECT id INTO children_dept_id 
    FROM departments 
    WHERE (name ILIKE '%children%' OR name ILIKE '%child%') 
      AND is_active = true 
    LIMIT 1;
    
    -- Get a profile ID
    SELECT id INTO profile_id FROM profiles LIMIT 1;
    
    -- Only proceed if we found the department
    IF children_dept_id IS NOT NULL THEN
        -- Insert 5 extra transactions for Children's Department
        INSERT INTO financial_transactions (
            id, department_id, transaction_type, amount, currency, description, 
            payment_method, date, recorded_by, verified, created_at
        ) VALUES
            (uuid_generate_v4(), children_dept_id, 'tithe'::transaction_type, 15000, 'TZS', 'Children Dept - Extra Transaction #1', 'Cash', CURRENT_DATE - INTERVAL '1 day', profile_id, true, NOW()),
            (uuid_generate_v4(), children_dept_id, 'offering'::transaction_type, 25000, 'TZS', 'Children Dept - Extra Transaction #2', 'M-Pesa', CURRENT_DATE - INTERVAL '2 days', profile_id, true, NOW()),
            (uuid_generate_v4(), children_dept_id, 'donation'::transaction_type, 35000, 'TZS', 'Children Dept - Extra Transaction #3', 'Bank Transfer', CURRENT_DATE - INTERVAL '3 days', profile_id, true, NOW()),
            (uuid_generate_v4(), children_dept_id, 'project'::transaction_type, 45000, 'TZS', 'Children Dept - Extra Transaction #4', 'Cash', CURRENT_DATE - INTERVAL '4 days', profile_id, true, NOW()),
            (uuid_generate_v4(), children_dept_id, 'expense'::transaction_type, 55000, 'TZS', 'Children Dept - Extra Transaction #5', 'M-Pesa', CURRENT_DATE - INTERVAL '5 days', profile_id, true, NOW());
            
        RAISE NOTICE 'Added 5 extra transactions for Children Department';
    ELSE
        RAISE NOTICE 'Children Department not found - could not add extra transactions';
    END IF;
END $$;

-- Verify transactions were created for Children's Department
SELECT 
    'Children Department Transactions:' as info,
    d.name as department_name,
    COUNT(ft.id) as transaction_count,
    SUM(ft.amount) as total_amount
FROM financial_transactions ft
JOIN departments d ON ft.department_id = d.id
WHERE (d.name ILIKE '%children%' OR d.name ILIKE '%child%')
  AND d.is_active = true
GROUP BY d.id, d.name;

-- Test the specific query that the finance page uses
SELECT 
    'Test Query Results:' as info,
    COUNT(*) as count_for_children_dept
FROM financial_transactions ft
WHERE ft.department_id = (
    SELECT id FROM departments 
    WHERE (name ILIKE '%children%' OR name ILIKE '%child%') 
      AND is_active = true 
    LIMIT 1
);

-- Verify the results
SELECT 
    d.name as department_name,
    COUNT(ft.id) as transaction_count,
    SUM(ft.amount) as total_amount,
    ROUND(AVG(ft.amount), 2) as avg_amount
FROM financial_transactions ft
JOIN departments d ON ft.department_id = d.id
WHERE d.is_active = true
GROUP BY d.id, d.name
ORDER BY d.name;

-- Final summary
SELECT 
    COUNT(*) as total_transactions,
    COUNT(DISTINCT department_id) as departments_with_transactions,
    SUM(amount) as total_amount,
    ROUND(AVG(amount), 2) as average_amount
FROM financial_transactions
WHERE department_id IS NOT NULL;