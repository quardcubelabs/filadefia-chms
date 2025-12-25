-- Simple RLS Fix - Run these commands ONE BY ONE

-- Step 1: Check what policies currently exist on departments
SELECT 'Current department policies:' as info;
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'departments'
ORDER BY policyname;

-- Step 2: Add service_role policy (this is the key fix)
CREATE POLICY "service_role_departments" 
ON departments 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Step 3: Verify the policy was created
SELECT 'After adding service_role policy:' as info;
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'departments' 
AND policyname = 'service_role_departments';

-- Step 4: Test direct access (this should work now)
SELECT 'Testing departments access:' as info;
SELECT id, name, swahili_name 
FROM departments 
WHERE is_active = true 
LIMIT 3;