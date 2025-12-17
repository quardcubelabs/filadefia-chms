-- Complete Database Schema Fix for Department Leader Recognition
-- This addresses the fundamental relationship issues between users, members, and departments

-- Step 1: Add department relationship to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE members ADD CONSTRAINT IF NOT EXISTS fk_members_department 
  FOREIGN KEY (department_id) REFERENCES departments(id);

-- Step 2: Add department leadership to profiles table (for department leaders)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS led_department_id UUID;
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS fk_profiles_led_department 
  FOREIGN KEY (led_department_id) REFERENCES departments(id);

-- Step 3: Create proper user_id to member_id mapping
-- Step 4: Link Doreen's profile to member record via user_id
UPDATE members 
SET user_id = (
    SELECT user_id FROM profiles 
    WHERE email = 'mwakabonga_fcc@gmail.com'
)
WHERE (email ILIKE '%mwakabonga%' OR first_name ILIKE '%doreen%')
  AND user_id IS NULL;

-- Step 5: Set up Children Department with proper leadership
UPDATE departments 
SET leader_id = (
    SELECT user_id FROM profiles 
    WHERE email = 'mwakabonga_fcc@gmail.com'
)
WHERE name ILIKE '%children%';

-- Step 6: Create the Children Department if it doesn't exist
INSERT INTO departments (
    id,
    name,
    swahili_name,
    description,
    leader_id,
    is_active,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Children Department',
    'Idara ya Watoto',
    'Department for children ministry and programs',
    p.user_id,
    true,
    NOW(),
    NOW()
FROM profiles p
WHERE p.email = 'mwakabonga_fcc@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM departments 
    WHERE name = 'Children Department'
);

-- Step 7: Final verification - Show the complete relationship chain
SELECT 'COMPLETE RELATIONSHIP VERIFICATION:' as status;
SELECT 
    p.user_id,
    p.email,
    p.first_name || ' ' || p.last_name as profile_name,
    p.role,
    d.id as department_id,
    d.name as department_name,
    '/departments/' || d.id as redirect_url
FROM profiles p
LEFT JOIN departments d ON d.leader_id = p.user_id
WHERE p.email = 'mwakabonga_fcc@gmail.com';
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