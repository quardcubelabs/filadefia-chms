-- Complete Department Leader Setup with lastname_fcc@gmail.com Format
-- Run this script to create/update all department leader credentials with the new email format
-- Password: FCC2026 for all department leaders

DO $$
DECLARE
    dept_record RECORD;
    member_record RECORD;
    leader_count INTEGER := 0;
    updated_count INTEGER := 0;
    new_email TEXT;
    old_email TEXT;
BEGIN
    RAISE NOTICE '=== COMPLETE DEPARTMENT LEADER SETUP ===';
    RAISE NOTICE 'Email Format: lastname_fcc@gmail.com';
    RAISE NOTICE 'Password: FCC2026';
    RAISE NOTICE '';
    
    -- STEP 1: Update existing profiles with old format (.fcc) to new format (_fcc)
    RAISE NOTICE '1. Updating existing department leader email formats...';
    
    FOR dept_record IN 
        SELECT id, email, first_name, last_name
        FROM profiles 
        WHERE role = 'department_leader' 
          AND email LIKE '%.fcc@gmail.com'
          AND email NOT LIKE '%_fcc@gmail.com'
        ORDER BY email
    LOOP
        old_email := dept_record.email;
        new_email := REPLACE(old_email, '.fcc@gmail.com', '_fcc@gmail.com');
        
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = new_email) THEN
            UPDATE profiles 
            SET email = new_email, updated_at = NOW()
            WHERE id = dept_record.id;
            
            updated_count := updated_count + 1;
            RAISE NOTICE '   Updated: % % (%)', dept_record.first_name, dept_record.last_name, new_email;
        END IF;
    END LOOP;
    
    RAISE NOTICE '   Profiles updated: %', updated_count;
    RAISE NOTICE '';
    
    -- STEP 2: Create profiles for department leaders that don't have them yet
    RAISE NOTICE '2. Creating new department leader profiles...';
    
    FOR dept_record IN 
        SELECT d.id, d.name, d.leader_id, 
               m.first_name, m.last_name, m.email
        FROM departments d
        LEFT JOIN members m ON d.leader_id = m.id
        WHERE d.is_active = true AND d.leader_id IS NOT NULL
        ORDER BY d.name
    LOOP
        new_email := LOWER(dept_record.last_name) || '_fcc@gmail.com';
        
        -- Check if profile already exists with the new format
        IF NOT EXISTS (
            SELECT 1 FROM profiles p 
            WHERE LOWER(p.email) = new_email
        ) THEN
            -- Create profile for department leader
            INSERT INTO profiles (
                email,
                role,
                first_name,
                last_name,
                is_active,
                created_at
            ) VALUES (
                new_email,
                'department_leader',
                dept_record.first_name,
                dept_record.last_name,
                true,
                NOW()
            );
            
            leader_count := leader_count + 1;
            RAISE NOTICE '   Created: % % (% Department) - %', 
                         dept_record.first_name, 
                         dept_record.last_name,
                         dept_record.name,
                         new_email;
        ELSE
            RAISE NOTICE '   Exists: % % (% Department) - %', 
                         dept_record.first_name, 
                         dept_record.last_name,
                         dept_record.name,
                         new_email;
        END IF;
    END LOOP;
    
    RAISE NOTICE '   New profiles created: %', leader_count;
    RAISE NOTICE '';
    
    -- STEP 3: Display final summary
    RAISE NOTICE '=== FINAL DEPARTMENT LEADER CREDENTIALS ===';
    RAISE NOTICE 'Password for ALL leaders: FCC2026';
    RAISE NOTICE '';
    
    FOR dept_record IN 
        SELECT 
            d.name as dept_name,
            p.email, 
            p.first_name, 
            p.last_name,
            CASE WHEN d.leader_id IS NOT NULL THEN 'Assigned' ELSE 'Not Assigned' END as status
        FROM profiles p
        LEFT JOIN members m ON (
            LOWER(m.first_name) = LOWER(p.first_name) AND 
            LOWER(m.last_name) = LOWER(p.last_name)
        )
        LEFT JOIN departments d ON d.leader_id = m.id AND d.is_active = true
        WHERE p.role = 'department_leader' 
          AND p.email LIKE '%_fcc@gmail.com'
        ORDER BY d.name NULLS LAST, p.last_name
    LOOP
        RAISE NOTICE '│ %-25s │ %-30s │ %-20s │ %-12s │', 
                     COALESCE(dept_record.dept_name, 'Unassigned'),
                     dept_record.email,
                     dept_record.first_name || ' ' || dept_record.last_name,
                     dept_record.status;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'SUMMARY:';
    RAISE NOTICE '- Existing emails updated: %', updated_count;
    RAISE NOTICE '- New profiles created: %', leader_count;
    RAISE NOTICE '- All emails now use format: lastname_fcc@gmail.com';
    RAISE NOTICE '- Password for all: FCC2026';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: You need to create these accounts in Supabase Auth manually';
    RAISE NOTICE '   or have the leaders sign up using these exact email addresses.';
    
END $$;

-- Verification Query - Run this to see all department leader credentials
SELECT 
    'VERIFICATION QUERY' as info,
    d.name as department,
    p.email as login_email,
    p.first_name || ' ' || p.last_name as leader_name,
    'FCC2026' as password,
    p.is_active as active
FROM departments d
JOIN members m ON d.leader_id = m.id
JOIN profiles p ON (
    LOWER(p.first_name) = LOWER(m.first_name) AND 
    LOWER(p.last_name) = LOWER(m.last_name) AND
    p.role = 'department_leader'
)
WHERE d.is_active = true 
  AND p.email LIKE '%_fcc@gmail.com'
ORDER BY d.name;