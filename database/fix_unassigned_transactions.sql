-- Delete all financial transactions with no department assigned
-- This will ensure department leaders only see their department's transactions

-- First, let's see what we're about to delete
SELECT 
    'Transactions to be DELETED' as action,
    COUNT(*) as count_to_delete,
    SUM(amount) as total_amount_to_delete,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    'These are general church transactions with no department' as note
FROM financial_transactions 
WHERE department_id IS NULL;

-- Show what will remain after deletion
SELECT 
    'Transactions that will REMAIN' as action,
    COUNT(*) as count_remaining,
    SUM(amount) as total_amount_remaining,
    'These are department-specific transactions' as note
FROM financial_transactions 
WHERE department_id IS NOT NULL;

-- Show breakdown by department of what will remain
SELECT 
    'Department Breakdown (After Deletion)' as analysis,
    d.name as department_name,
    COUNT(*) as transaction_count,
    SUM(ft.amount) as total_amount
FROM financial_transactions ft
JOIN departments d ON ft.department_id = d.id
WHERE ft.department_id IS NOT NULL
GROUP BY ft.department_id, d.name
ORDER BY transaction_count DESC;

-- ⚠️  CAUTION: This will permanently delete data!
-- Uncomment the line below to execute the deletion
-- DELETE FROM financial_transactions WHERE department_id IS NULL;

-- Alternative: Instead of deleting, assign to a "General" department
-- First create a General department if it doesn't exist
INSERT INTO departments (id, name, swahili_name, description, is_active, created_at)
SELECT 
    gen_random_uuid(),
    'General Church',
    'Kanisa kwa Ujumla',
    'General church transactions not specific to any department',
    true,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM departments WHERE name = 'General Church'
);

-- Get the General Church department ID
WITH general_dept AS (
    SELECT id FROM departments WHERE name = 'General Church' LIMIT 1
)
-- Update NULL transactions to belong to General Church department
UPDATE financial_transactions 
SET department_id = (SELECT id FROM general_dept)
WHERE department_id IS NULL;

-- Verify the update worked
SELECT 
    'After Update - Your Visible Transactions' as result,
    COUNT(*) as visible_count,
    'Only your department transactions should be visible now' as note
FROM financial_transactions 
WHERE department_id = '299ca070-b0f0-4c65-8d59-b514e04bced4';