-- Simple Department Leader Test Script
-- This is a diagnostic version to see what data we have

DO $$
DECLARE
    dept_record RECORD;
BEGIN
    RAISE NOTICE 'Testing department leader data...';
    
    -- First, let's see what departments exist
    RAISE NOTICE 'Checking departments table...';
    FOR dept_record IN 
        SELECT d.id, d.name, d.leader_id
        FROM departments d
        WHERE d.is_active = true
        ORDER BY d.name
        LIMIT 5
    LOOP
        RAISE NOTICE 'Department: % (ID: %, Leader ID: %)', 
                     dept_record.name, 
                     dept_record.id, 
                     COALESCE(dept_record.leader_id::text, 'NULL');
    END LOOP;
    
    -- Now let's check members table
    RAISE NOTICE 'Checking members table...';
    FOR dept_record IN 
        SELECT m.id, m.first_name, m.last_name, m.email
        FROM members m
        WHERE m.status = 'active'
        LIMIT 5
    LOOP
        RAISE NOTICE 'Member: % % (ID: %, Email: %)', 
                     dept_record.first_name, 
                     dept_record.last_name,
                     dept_record.id,
                     COALESCE(dept_record.email, 'NULL');
    END LOOP;
    
    -- Check profiles table
    RAISE NOTICE 'Checking profiles table...';
    FOR dept_record IN 
        SELECT p.id, p.first_name, p.last_name, p.email, p.role
        FROM profiles p
        LIMIT 5
    LOOP
        RAISE NOTICE 'Profile: % % (Email: %, Role: %)', 
                     dept_record.first_name, 
                     dept_record.last_name,
                     dept_record.email,
                     dept_record.role;
    END LOOP;
    
    RAISE NOTICE 'Diagnostic complete!';
END $$;