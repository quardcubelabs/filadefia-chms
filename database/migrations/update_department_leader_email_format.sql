-- Update Department Leader Email Format
-- This script updates existing department leader credentials from lastname.fcc@gmail.com to lastname_fcc@gmail.com format

DO $$
DECLARE
    profile_record RECORD;
    updated_count INTEGER := 0;
    old_email TEXT;
    new_email TEXT;
BEGIN
    RAISE NOTICE 'Starting Department Leader Email Format Update...';
    
    -- Update profiles with .fcc@gmail.com format to _fcc@gmail.com format
    FOR profile_record IN 
        SELECT id, email, first_name, last_name, role
        FROM profiles 
        WHERE role = 'department_leader' 
          AND email LIKE '%.fcc@gmail.com'
          AND email NOT LIKE '%_fcc@gmail.com'
        ORDER BY email
    LOOP
        old_email := profile_record.email;
        new_email := REPLACE(old_email, '.fcc@gmail.com', '_fcc@gmail.com');
        
        -- Check if the new email already exists
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = new_email) THEN
            -- Update the email
            UPDATE profiles 
            SET email = new_email, 
                updated_at = NOW()
            WHERE id = profile_record.id;
            
            updated_count := updated_count + 1;
            
            RAISE NOTICE 'Updated: % % - % → %', 
                         profile_record.first_name, 
                         profile_record.last_name,
                         old_email,
                         new_email;
        ELSE
            RAISE WARNING 'Skipped: % % - New email % already exists', 
                         profile_record.first_name, 
                         profile_record.last_name,
                         new_email;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Department Leader Email Format Update completed!';
    RAISE NOTICE 'Total profiles updated: %', updated_count;
    
    -- Display current department leader credentials
    RAISE NOTICE '';
    RAISE NOTICE '=== UPDATED DEPARTMENT LEADER CREDENTIALS ===';
    RAISE NOTICE 'Password for all leaders: FCC2026';
    RAISE NOTICE '';
    
    FOR profile_record IN 
        SELECT p.email, p.first_name, p.last_name, d.name as dept_name
        FROM profiles p
        LEFT JOIN members m ON (LOWER(m.first_name) = LOWER(p.first_name) AND LOWER(m.last_name) = LOWER(p.last_name))
        LEFT JOIN departments d ON d.leader_id = m.id
        WHERE p.role = 'department_leader' 
          AND p.email LIKE '%_fcc@gmail.com'
        ORDER BY p.email
    LOOP
        RAISE NOTICE 'Email: % | Name: % % | Department: %', 
                     profile_record.email,
                     profile_record.first_name,
                     profile_record.last_name,
                     COALESCE(profile_record.dept_name, 'Not Assigned');
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'All department leader emails now use the format: lastname_fcc@gmail.com';
    
END $$;