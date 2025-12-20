-- Fix Financial Transactions Department Assignment
-- This script assigns existing transactions to departments so department leaders can see relevant data

-- First, let's see what departments we have
SELECT id, name FROM departments WHERE is_active = true ORDER BY name;

-- Check current transaction distribution
SELECT 
  department_id,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount
FROM financial_transactions 
GROUP BY department_id 
ORDER BY transaction_count DESC;

-- Update transactions to assign them to departments
-- This distributes existing transactions across departments

DO $$
DECLARE
    dept_record RECORD;
    dept_ids UUID[];
    transaction_record RECORD;
    current_dept_index INTEGER := 0;
    total_depts INTEGER;
BEGIN
    -- Get all active department IDs
    SELECT array_agg(id) INTO dept_ids 
    FROM departments 
    WHERE is_active = true;
    
    total_depts := array_length(dept_ids, 1);
    
    IF total_depts IS NULL OR total_depts = 0 THEN
        RAISE NOTICE 'No active departments found. Cannot assign transactions.';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found % active departments', total_depts;
    
    -- Update transactions that don't have a department assigned
    -- Distribute them evenly across departments
    FOR transaction_record IN 
        SELECT id, transaction_type, amount, date 
        FROM financial_transactions 
        WHERE department_id IS NULL 
        ORDER BY date DESC
        LIMIT 250  -- Update up to 250 transactions
    LOOP
        current_dept_index := current_dept_index + 1;
        IF current_dept_index > total_depts THEN
            current_dept_index := 1;
        END IF;
        
        UPDATE financial_transactions 
        SET department_id = dept_ids[current_dept_index]
        WHERE id = transaction_record.id;
        
        -- Log every 50th update
        IF current_dept_index % 50 = 0 THEN
            RAISE NOTICE 'Updated % transactions so far...', current_dept_index;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed transaction department assignment';
END $$;

-- Verify the distribution after update
SELECT 
  d.name as department_name,
  COUNT(ft.id) as transaction_count,
  SUM(ft.amount) as total_amount,
  ROUND(AVG(ft.amount), 2) as avg_amount
FROM financial_transactions ft
RIGHT JOIN departments d ON ft.department_id = d.id
WHERE d.is_active = true
GROUP BY d.id, d.name
ORDER BY transaction_count DESC;

-- Show some church-wide transactions (null department_id)
SELECT 
  COUNT(*) as church_wide_transactions,
  SUM(amount) as total_church_wide_amount
FROM financial_transactions 
WHERE department_id IS NULL;

-- Final summary
SELECT 
  'TOTAL' as category,
  COUNT(*) as total_transactions,
  SUM(amount) as total_amount
FROM financial_transactions
UNION ALL
SELECT 
  'WITH_DEPARTMENT' as category,
  COUNT(*) as total_transactions,
  SUM(amount) as total_amount
FROM financial_transactions
WHERE department_id IS NOT NULL
UNION ALL
SELECT 
  'CHURCH_WIDE' as category,
  COUNT(*) as total_transactions,
  SUM(amount) as total_amount
FROM financial_transactions
WHERE department_id IS NULL;