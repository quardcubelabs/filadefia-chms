-- Check financial transactions distribution by department
-- This helps understand why you might still be seeing many transactions

-- Count transactions by department
SELECT 
    'Transaction Count by Department' as analysis,
    COALESCE(d.name, 'No Department (NULL)') as department_name,
    COUNT(*) as transaction_count,
    ROUND(AVG(amount)) as avg_amount
FROM financial_transactions ft
LEFT JOIN departments d ON ft.department_id = d.id
GROUP BY ft.department_id, d.name
ORDER BY transaction_count DESC;

-- Check specifically for Children's Department transactions
SELECT 
    'Children Department Transactions' as analysis,
    COUNT(*) as total_transactions,
    SUM(amount) as total_amount,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM financial_transactions 
WHERE department_id = '299ca070-b0f0-4c65-8d59-b514e04bced4';

-- Check NULL department transactions (general church transactions)
SELECT 
    'General Church Transactions (NULL department)' as analysis,
    COUNT(*) as transaction_count,
    'These transactions are visible to all department leaders' as note
FROM financial_transactions 
WHERE department_id IS NULL;

-- Test what you should see based on current RLS policy
SELECT 
    'What RLS Policy Should Show You' as analysis,
    COUNT(*) as visible_transactions,
    'This is what you should see in the finance page' as note
FROM financial_transactions 
WHERE department_id = '299ca070-b0f0-4c65-8d59-b514e04bced4' 
   OR department_id IS NULL;