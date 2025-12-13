    -- Create Department Leader Credentials
    -- This script creates profiles for department leaders with consistent login credentials
    -- Password: FCC2026 for all department leaders
    -- Username: lastname (all lowercase)

    DO $$
    DECLARE
        dept_record RECORD;
        member_record RECORD;
        leader_count INTEGER := 0;
    BEGIN
        RAISE NOTICE 'Creating Department Leader Credentials...';
        
        -- First, ensure all departments have leaders assigned
        FOR dept_record IN 
            SELECT d.id, d.name, d.leader_id, 
                m.first_name, m.last_name, m.email
            FROM departments d
            LEFT JOIN members m ON d.leader_id = m.id
            WHERE d.is_active = true
            ORDER BY d.name
        LOOP
            IF dept_record.leader_id IS NOT NULL THEN
                -- Check if profile already exists for this leader
                IF NOT EXISTS (
                    SELECT 1 FROM profiles p 
                    WHERE LOWER(p.email) = LOWER(dept_record.last_name || '_fcc@gmail.com')
                       OR LOWER(p.email) = LOWER(COALESCE(dept_record.email, ''))
                ) THEN
                    -- Create profile for department leader
                    INSERT INTO profiles (
                        email,
                        role,
                        first_name,
                        last_name,
                        is_active
                    ) VALUES (
                        LOWER(dept_record.last_name) || '_fcc@gmail.com',
                        'department_leader',
                        dept_record.first_name,
                        dept_record.last_name,
                        true
                    );
                    
                    leader_count := leader_count + 1;
                    
                    RAISE NOTICE 'Created profile for % % (% Department)', 
                                dept_record.first_name, 
                                dept_record.last_name,
                                dept_record.name;
                    RAISE NOTICE '  Email: %', LOWER(dept_record.last_name) || '_fcc@gmail.com';
                    RAISE NOTICE '  Password: FCC2026';
                    RAISE NOTICE '  Role: department_leader';
                    RAISE NOTICE '---';
                ELSE
                    RAISE NOTICE 'Profile already exists for % % (% Department)', 
                                dept_record.first_name, 
                                dept_record.last_name,
                                dept_record.name;
                END IF;
            ELSE
                RAISE WARNING 'Department "%" has no assigned leader', dept_record.name;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Department Leader Credentials Creation completed!';
        RAISE NOTICE 'Total new profiles created: %', leader_count;
        
        -- Display all department leader credentials
        RAISE NOTICE '';
        RAISE NOTICE '=== DEPARTMENT LEADER LOGIN CREDENTIALS ===';
        RAISE NOTICE 'Password for all leaders: FCC2026';
        RAISE NOTICE '';
        
        FOR dept_record IN 
            SELECT d.name as dept_name, p.email, p.first_name, p.last_name
            FROM departments d
            JOIN members m ON d.leader_id = m.id
            JOIN profiles p ON (
                LOWER(p.last_name) = LOWER(m.last_name) AND 
                p.role = 'department_leader'
            )
            WHERE d.is_active = true
            ORDER BY d.name
        LOOP
            RAISE NOTICE '% Department: % (Email: %)', 
                        dept_record.dept_name,
                        dept_record.first_name || ' ' || dept_record.last_name,
                        dept_record.email;
        END LOOP;
        
        RAISE NOTICE '';
        RAISE NOTICE 'Note: These profiles need to be created in Supabase Auth manually';
        RAISE NOTICE 'or through the application signup process using the emails above.';
        
    END $$;