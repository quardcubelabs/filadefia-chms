-- Delete all financial transactions with NULL department_id
-- ⚠️ WARNING: This will permanently delete data!

-- Step 1: Show what will be deleted (for confirmation)
SELECT 
    'Transactions to be DELETED' as action,
    COUNT(*) as transactions_to_delete,
    SUM(amount) as total_amount_to_delete,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM financial_transactions 
WHERE department_id IS NULL;

-- Step 2: Show what will remain
SELECT 
    'Transactions that will REMAIN' as action,
    COUNT(*) as transactions_remaining,
    SUM(amount) as total_amount_remaining
FROM financial_transactions 
WHERE department_id IS NOT NULL;

-- Step 3: Execute the deletion
-- ⚠️ This is PERMANENT - there's no undo!
DELETE FROM financial_transactions 
WHERE department_id IS NULL;

-- Step 4: Verify deletion worked
SELECT 
    'After Deletion - Total Transactions' as result,
    COUNT(*) as total_remaining,
    'All remaining transactions have department assignments' as note
FROM financial_transactions;

-- Step 5: Check what you'll see now (Children's Department only)
SELECT 
    'Your Visible Transactions Now' as result,
    COUNT(*) as visible_count,
    SUM(amount) as total_amount,
    'Only Children Department transactions' as note
FROM financial_transactions 
WHERE department_id = '299ca070-b0f0-4c65-8d59-b514e04bced4';