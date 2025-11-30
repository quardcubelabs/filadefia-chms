-- Assign Department Leaders Script
-- This script assigns existing members as leaders to departments that don't have leaders

DO $$
DECLARE
    member_record RECORD;
    dept_record RECORD;
    assigned_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting Department Leaders Assignment...';
    
    -- Check if we have members and departments
    IF NOT EXISTS (SELECT 1 FROM members LIMIT 1) THEN
        RAISE EXCEPTION 'No members found in database.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM departments LIMIT 1) THEN
        RAISE EXCEPTION 'No departments found in database.';
    END IF;
    
    -- Assign leaders to departments that don't have leaders
    FOR dept_record IN 
        SELECT id, name 
        FROM departments 
        WHERE leader_id IS NULL AND is_active = true
        ORDER BY name
    LOOP
        -- Get a random active member to be the leader
        SELECT id, first_name, last_name 
        INTO member_record 
        FROM members 
        WHERE status = 'active' 
        ORDER BY random() 
        LIMIT 1;
        
        IF member_record.id IS NOT NULL THEN
            -- Update department with leader
            UPDATE departments 
            SET leader_id = member_record.id 
            WHERE id = dept_record.id;
            
            -- Add the member to department_members if not already there
            INSERT INTO department_members (department_id, member_id, position, joined_date, is_active)
            VALUES (dept_record.id, member_record.id, 'chairperson', CURRENT_DATE, true)
            ON CONFLICT DO NOTHING;
            
            assigned_count := assigned_count + 1;
            
            RAISE NOTICE 'Assigned % % as leader of %', 
                         member_record.first_name, 
                         member_record.last_name, 
                         dept_record.name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Department Leaders Assignment completed!';
    RAISE NOTICE 'Total leaders assigned: %', assigned_count;
    
    -- Verify the assignments
    RAISE NOTICE 'Current Department Leaders:';
    FOR dept_record IN 
        SELECT 
            d.name as dept_name,
            m.first_name || ' ' || m.last_name as leader_name
        FROM departments d
        LEFT JOIN members m ON d.leader_id = m.id
        WHERE d.is_active = true
        ORDER BY d.name
    LOOP
        RAISE NOTICE '% -> %', dept_record.dept_name, COALESCE(dept_record.leader_name, 'No Leader');
    END LOOP;
    
END $$;

-- Verify department leaders
SELECT 
    'Department Leaders Summary' as summary,
    d.name as department_name,
    CASE 
        WHEN d.leader_id IS NOT NULL THEN m.first_name || ' ' || m.last_name
        ELSE 'No Leader Assigned'
    END as leader_name,
    d.is_active
FROM departments d
LEFT JOIN members m ON d.leader_id = m.id
ORDER BY d.name;