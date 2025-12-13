-- Quick Department Leader Setup Script
-- This ensures a proper link between profile -> member -> department leader

DO $$
DECLARE
    user_email TEXT := 'childrens_fcc@gmail.com';  -- Change this to your test email
    dept_name TEXT := 'Children''s Department';     -- Change this to the department name
    first_name TEXT := 'Grace';                     -- Change this to match your profile
    last_name TEXT := 'Childrens';                  -- Change this to match your profile
    
    member_id UUID;
    dept_id UUID;
    profile_exists BOOLEAN;
BEGIN
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE email = user_email) INTO profile_exists;
    
    IF NOT profile_exists THEN
        RAISE NOTICE 'Creating profile for %', user_email;
        INSERT INTO profiles (email, first_name, last_name, role, is_active) 
        VALUES (user_email, first_name, last_name, 'department_leader', true);
    END IF;
    
    -- Find or create member record
    SELECT id INTO member_id FROM members 
    WHERE first_name = first_name AND last_name = last_name;
    
    IF member_id IS NULL THEN
        RAISE NOTICE 'Creating member record for % %', first_name, last_name;
        INSERT INTO members (first_name, last_name, email, status, member_number)
        VALUES (first_name, last_name, user_email, 'active', 'MEM' || LPAD(EXTRACT(epoch FROM NOW())::TEXT, 6, '0'))
        RETURNING id INTO member_id;
    END IF;
    
    -- Find department
    SELECT id INTO dept_id FROM departments WHERE name = dept_name;
    
    IF dept_id IS NULL THEN
        RAISE EXCEPTION 'Department "%" not found', dept_name;
    END IF;
    
    -- Update department to set this member as leader
    UPDATE departments SET leader_id = member_id WHERE id = dept_id;
    
    RAISE NOTICE '✅ Setup Complete!';
    RAISE NOTICE 'Profile Email: %', user_email;
    RAISE NOTICE 'Member ID: %', member_id;
    RAISE NOTICE 'Department ID: %', dept_id;
    RAISE NOTICE 'Department Name: %', dept_name;
    RAISE NOTICE 'Expected Dashboard URL: /departments/%', dept_id;
    RAISE NOTICE '';
    RAISE NOTICE '🔗 Login with: %', user_email;
    RAISE NOTICE '🏠 Dashboard URL: http://localhost:3000/departments/%', dept_id;
    
END $$;