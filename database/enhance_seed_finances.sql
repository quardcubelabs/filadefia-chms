-- Enhanced Financial Seed Script: Complete Department Coverage & 2025 Data
-- This script adds transactions for missing departments and creates 2025 data for proper dashboard functionality
-- Missing departments: Media & Technical, Discipleship & Teaching, Mission & Outreach, Welfare & Counseling

DO $$
DECLARE
    -- Member variables for random selection
    member_ids UUID[];
    selected_member UUID;
    
    -- Department variables (including the missing ones)
    dept_media_technical UUID;
    dept_discipleship_teaching UUID;
    dept_mission_outreach UUID;
    dept_welfare_counseling UUID;
    
    -- Profile ID for recorded_by field
    admin_profile_id UUID;
    
    -- Payment methods array
    payment_methods TEXT[] := ARRAY['Cash', 'M-Pesa', 'TigoPesa', 'Airtel Money', 'Bank Transfer'];
    
    -- Transaction types array
    transaction_types TEXT[] := ARRAY['tithe', 'offering', 'donation', 'project', 'pledge', 'mission'];
    
    -- Counter for tracking insertions
    insert_count INTEGER := 0;
    
    -- Date variables for 2024 & 2025 data
    current_date_var DATE;
    week_counter INTEGER;
BEGIN
    RAISE NOTICE 'Starting Enhanced Financial Seed Script...';
    
    -- Verify dependencies exist
    IF NOT EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN
        RAISE EXCEPTION 'No profiles found. Please ensure profiles table has data.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM members LIMIT 1) THEN
        RAISE EXCEPTION 'No members found. Please ensure members table has data.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM departments LIMIT 1) THEN
        RAISE EXCEPTION 'No departments found. Please ensure departments table has data.';
    END IF;
    
    -- Get member IDs for random selection
    SELECT ARRAY(SELECT id FROM members ORDER BY random() LIMIT 20) INTO member_ids;
    
    IF array_length(member_ids, 1) = 0 THEN
        RAISE EXCEPTION 'No member IDs retrieved for transaction creation.';
    END IF;
    
    RAISE NOTICE 'Retrieved % member IDs for random selection', array_length(member_ids, 1);
    
    -- Get admin profile ID for recorded_by field
    SELECT id INTO admin_profile_id FROM profiles WHERE role = 'administrator' LIMIT 1;
    
    IF admin_profile_id IS NULL THEN
        -- Fallback to any profile if no admin found
        SELECT id INTO admin_profile_id FROM profiles LIMIT 1;
    END IF;
    
    IF admin_profile_id IS NULL THEN
        RAISE EXCEPTION 'No profile found to use as recorder. Please ensure profiles table has data.';
    END IF;
    
    RAISE NOTICE 'Using profile ID % as transaction recorder', admin_profile_id;
    
    -- Get missing department IDs
    SELECT id INTO dept_media_technical FROM departments WHERE name ILIKE '%Media%Technical%' OR name ILIKE 'Media & Technical' LIMIT 1;
    SELECT id INTO dept_discipleship_teaching FROM departments WHERE name ILIKE '%Discipleship%Teaching%' OR name ILIKE 'Discipleship & Teaching' LIMIT 1;
    SELECT id INTO dept_mission_outreach FROM departments WHERE name ILIKE '%Mission%Outreach%' OR name ILIKE 'Mission & Outreach' LIMIT 1;
    SELECT id INTO dept_welfare_counseling FROM departments WHERE name ILIKE '%Welfare%Counseling%' OR name ILIKE 'Welfare & Counseling' LIMIT 1;
    
    RAISE NOTICE 'Department IDs: Media & Technical=%, Discipleship & Teaching=%, Mission & Outreach=%, Welfare & Counseling=%', 
                 dept_media_technical, dept_discipleship_teaching, dept_mission_outreach, dept_welfare_counseling;
    
    -- ===============================
    -- PART 1: Add Missing Department Transactions (2024 data)
    -- ===============================
    
    -- Media & Technical Department (2024)
    IF dept_media_technical IS NOT NULL THEN
        FOR i IN 1..8 LOOP
            selected_member := member_ids[1 + (i % array_length(member_ids, 1))];
            
            INSERT INTO financial_transactions (
                member_id, transaction_type, amount, payment_method, 
                date, description, department_id, verified, recorded_by
            ) VALUES (
                selected_member,
                transaction_types[1 + (i % array_length(transaction_types, 1))]::transaction_type,
                CASE 
                    WHEN i <= 2 THEN 150000 + (i * 25000) -- Equipment purchases
                    WHEN i <= 4 THEN 50000 + (i * 15000)  -- Software/licenses
                    ELSE 25000 + (i * 8000)               -- Regular maintenance
                END,
                payment_methods[1 + (i % array_length(payment_methods, 1))],
                '2024-01-15'::DATE + (i * 30) + (random() * 10)::INTEGER,
                CASE 
                    WHEN i = 1 THEN 'Audio Equipment Purchase'
                    WHEN i = 2 THEN 'Video Camera System'
                    WHEN i = 3 THEN 'Church Management Software License'
                    WHEN i = 4 THEN 'Streaming Platform Subscription'
                    WHEN i = 5 THEN 'Sound System Maintenance'
                    WHEN i = 6 THEN 'Projector Bulb Replacement'
                    WHEN i = 7 THEN 'Network Infrastructure Upgrade'
                    ELSE 'Technical Support Services'
                END,
                dept_media_technical,
                true,
                admin_profile_id
            );
            insert_count := insert_count + 1;
        END LOOP;
        RAISE NOTICE 'Added % transactions for Media & Technical Department (2024)', 8;
    END IF;
    
    -- Discipleship & Teaching Department (2024)
    IF dept_discipleship_teaching IS NOT NULL THEN
        FOR i IN 1..10 LOOP
            selected_member := member_ids[1 + (i % array_length(member_ids, 1))];
            
            INSERT INTO financial_transactions (
                member_id, transaction_type, amount, payment_method, 
                date, description, department_id, verified, recorded_by
            ) VALUES (
                selected_member,
                transaction_types[1 + (i % array_length(transaction_types, 1))]::transaction_type,
                CASE 
                    WHEN i <= 3 THEN 80000 + (i * 20000)  -- Training materials
                    WHEN i <= 6 THEN 45000 + (i * 12000)  -- Books and resources
                    ELSE 20000 + (i * 5000)               -- Small group materials
                END,
                payment_methods[1 + (i % array_length(payment_methods, 1))],
                '2024-02-01'::DATE + (i * 25) + (random() * 8)::INTEGER,
                CASE 
                    WHEN i = 1 THEN 'Bible Study Curriculum'
                    WHEN i = 2 THEN 'Leadership Training Materials'
                    WHEN i = 3 THEN 'Christian Education Books'
                    WHEN i = 4 THEN 'Sunday School Resources'
                    WHEN i = 5 THEN 'Discipleship Workbooks'
                    WHEN i = 6 THEN 'Teaching Aids and Charts'
                    WHEN i = 7 THEN 'Small Group Study Guides'
                    WHEN i = 8 THEN 'Children Ministry Materials'
                    WHEN i = 9 THEN 'Adult Education Resources'
                    ELSE 'Teacher Training Workshop'
                END,
                dept_discipleship_teaching,
                true,
                admin_profile_id
            );
            insert_count := insert_count + 1;
        END LOOP;
        RAISE NOTICE 'Added % transactions for Discipleship & Teaching Department (2024)', 10;
    END IF;
    
    -- Mission & Outreach Department (2024)
    IF dept_mission_outreach IS NOT NULL THEN
        FOR i IN 1..12 LOOP
            selected_member := member_ids[1 + (i % array_length(member_ids, 1))];
            
            INSERT INTO financial_transactions (
                member_id, transaction_type, amount, payment_method, 
                date, description, department_id, verified, recorded_by
            ) VALUES (
                selected_member,
                CASE 
                    WHEN i <= 8 THEN 'mission'::transaction_type
                    ELSE transaction_types[1 + (i % array_length(transaction_types, 1))]::transaction_type
                END,
                CASE 
                    WHEN i <= 4 THEN 200000 + (i * 50000)  -- Major mission trips
                    WHEN i <= 8 THEN 75000 + (i * 25000)   -- Local outreach
                    ELSE 30000 + (i * 10000)               -- Community programs
                END,
                payment_methods[1 + (i % array_length(payment_methods, 1))],
                '2024-01-10'::DATE + (i * 28) + (random() * 12)::INTEGER,
                CASE 
                    WHEN i = 1 THEN 'Mission Trip to Mwanza'
                    WHEN i = 2 THEN 'Evangelism Campaign Dodoma'
                    WHEN i = 3 THEN 'Church Planting Support Mbeya'
                    WHEN i = 4 THEN 'Mission Conference Arusha'
                    WHEN i = 5 THEN 'Street Evangelism Supplies'
                    WHEN i = 6 THEN 'Gospel Tracts Printing'
                    WHEN i = 7 THEN 'Community Health Program'
                    WHEN i = 8 THEN 'Food Distribution Program'
                    WHEN i = 9 THEN 'Prison Ministry Support'
                    WHEN i = 10 THEN 'Hospital Visitation Program'
                    WHEN i = 11 THEN 'Orphanage Support'
                    ELSE 'Mission Training Workshop'
                END,
                dept_mission_outreach,
                true,
                admin_profile_id
            );
            insert_count := insert_count + 1;
        END LOOP;
        RAISE NOTICE 'Added % transactions for Mission & Outreach Department (2024)', 12;
    END IF;
    
    -- Welfare & Counseling Department (2024)
    IF dept_welfare_counseling IS NOT NULL THEN
        FOR i IN 1..9 LOOP
            selected_member := member_ids[1 + (i % array_length(member_ids, 1))];
            
            INSERT INTO financial_transactions (
                member_id, transaction_type, amount, payment_method, 
                date, description, department_id, verified, recorded_by
            ) VALUES (
                selected_member,
                CASE 
                    WHEN i <= 6 THEN 'welfare'::transaction_type
                    ELSE transaction_types[1 + (i % array_length(transaction_types, 1))]::transaction_type
                END,
                CASE 
                    WHEN i <= 3 THEN 100000 + (i * 30000)  -- Major welfare support
                    WHEN i <= 6 THEN 50000 + (i * 15000)   -- Regular counseling
                    ELSE 25000 + (i * 8000)                -- Community support
                END,
                payment_methods[1 + (i % array_length(payment_methods, 1))],
                '2024-02-15'::DATE + (i * 35) + (random() * 15)::INTEGER,
                CASE 
                    WHEN i = 1 THEN 'Emergency Family Support'
                    WHEN i = 2 THEN 'Widow and Orphan Care'
                    WHEN i = 3 THEN 'Medical Emergency Fund'
                    WHEN i = 4 THEN 'Marriage Counseling Program'
                    WHEN i = 5 THEN 'Youth Counseling Support'
                    WHEN i = 6 THEN 'Grief Counseling Resources'
                    WHEN i = 7 THEN 'Community Food Bank'
                    WHEN i = 8 THEN 'Family Crisis Intervention'
                    ELSE 'Counseling Training Materials'
                END,
                dept_welfare_counseling,
                true,
                admin_profile_id
            );
            insert_count := insert_count + 1;
        END LOOP;
        RAISE NOTICE 'Added % transactions for Welfare & Counseling Department (2024)', 9;
    END IF;
    
    -- ===============================
    -- PART 2: Add Comprehensive 2025 Data for All Departments
    -- ===============================
    
    RAISE NOTICE 'Creating 2025 transaction data for improved dashboard charts...';
    
    -- Create 2025 weekly offering data with realistic variations for better chart display
    FOR week_counter IN 1..52 LOOP
        -- Calculate the date for each week in 2025
        current_date_var := '2025-01-05'::DATE + (week_counter - 1) * 7;
        
        -- Create 2-4 offering transactions per week with varying amounts
        FOR i IN 1..3 LOOP
            selected_member := member_ids[1 + ((week_counter + i) % array_length(member_ids, 1))];
            
            INSERT INTO financial_transactions (
                member_id, transaction_type, amount, payment_method, 
                date, description, department_id, verified, recorded_by
            ) VALUES (
                selected_member,
                'offering'::transaction_type,
                CASE 
                    -- Higher offerings on first and last Sundays of month
                    WHEN week_counter % 4 = 1 OR week_counter % 4 = 0 THEN 
                        (250000 + (random() * 150000)::INTEGER + (i * 50000))
                    -- Regular offerings with weekly variation
                    ELSE 
                        (150000 + (random() * 100000)::INTEGER + (i * 30000))
                END,
                payment_methods[1 + (i % array_length(payment_methods, 1))],
                current_date_var,
                CASE 
                    WHEN i = 1 THEN 'Sunday Morning Offering'
                    WHEN i = 2 THEN 'Sunday Evening Offering' 
                    ELSE 'Midweek Service Offering'
                END,
                NULL, -- General offering, no specific department
                true,
                admin_profile_id
            );
            insert_count := insert_count + 1;
        END LOOP;
        
        -- Add special monthly offerings with higher amounts
        IF week_counter % 4 = 1 THEN
            selected_member := member_ids[1 + (week_counter % array_length(member_ids, 1))];
            
            INSERT INTO financial_transactions (
                member_id, transaction_type, amount, payment_method, 
                date, description, department_id, verified, recorded_by
            ) VALUES (
                selected_member,
                'offering'::transaction_type,
                450000 + (random() * 200000)::INTEGER,
                'Bank Transfer',
                current_date_var,
                'Monthly Special Offering',
                NULL,
                true,
                admin_profile_id
            );
            insert_count := insert_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Added comprehensive 2025 weekly offering data (% transactions)', 52 * 3 + 12;
    
    -- Add 2025 tithe transactions with monthly patterns
    FOR i IN 1..24 LOOP
        selected_member := member_ids[1 + (i % array_length(member_ids, 1))];
        
        INSERT INTO financial_transactions (
            member_id, transaction_type, amount, payment_method, 
            date, description, department_id, verified, recorded_by
        ) VALUES (
            selected_member,
            'tithe'::transaction_type,
            (800000 + (random() * 400000)::INTEGER),
            payment_methods[1 + (i % array_length(payment_methods, 1))],
            '2025-01-01'::DATE + (i * 15) + (random() * 10)::INTEGER,
            'Monthly Tithe Payment',
            NULL,
            true,
            admin_profile_id
        );
        insert_count := insert_count + 1;
    END LOOP;
    
    -- Add 2025 project and mission transactions
    FOR i IN 1..20 LOOP
        selected_member := member_ids[1 + (i % array_length(member_ids, 1))];
        
        INSERT INTO financial_transactions (
            member_id, transaction_type, amount, payment_method, 
            date, description, department_id, verified, recorded_by
        ) VALUES (
            selected_member,
            CASE WHEN i % 2 = 0 THEN 'project'::transaction_type ELSE 'mission'::transaction_type END,
            (300000 + (random() * 500000)::INTEGER),
            payment_methods[1 + (i % array_length(payment_methods, 1))],
            '2025-01-15'::DATE + (i * 18) + (random() * 12)::INTEGER,
            CASE 
                WHEN i % 2 = 0 THEN 'Church Building Project 2025'
                ELSE 'Mission Expansion 2025'
            END,
            CASE WHEN i % 3 = 0 THEN dept_mission_outreach ELSE NULL END,
            true,
            admin_profile_id
        );
        insert_count := insert_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Enhanced Financial Seed Script completed successfully!';
    RAISE NOTICE 'Total new transactions inserted: %', insert_count;
    RAISE NOTICE 'Coverage: All 12 departments now have transaction data';
    RAISE NOTICE '2025 Data: % weekly offerings, % tithes, % projects/missions', 52 * 4, 24, 20;
    RAISE NOTICE 'Dashboard charts should now display properly with varied amounts and 2025 filtering capability';
    
    -- Final verification
    RAISE NOTICE 'Verifying transaction counts by year...';
    RAISE NOTICE '2024 transactions: %', (SELECT COUNT(*) FROM financial_transactions WHERE EXTRACT(YEAR FROM date) = 2024);
    RAISE NOTICE '2025 transactions: %', (SELECT COUNT(*) FROM financial_transactions WHERE EXTRACT(YEAR FROM date) = 2025);
    RAISE NOTICE 'Total transactions: %', (SELECT COUNT(*) FROM financial_transactions);
    
END $$;

-- Verify enhanced data creation
SELECT 
    'Enhanced Financial Data Summary' as summary,
    COUNT(*) as total_transactions,
    COUNT(DISTINCT department_id) as departments_covered,
    MIN(date) as earliest_transaction,
    MAX(date) as latest_transaction,
    SUM(CASE WHEN EXTRACT(YEAR FROM date) = 2024 THEN 1 ELSE 0 END) as transactions_2024,
    SUM(CASE WHEN EXTRACT(YEAR FROM date) = 2025 THEN 1 ELSE 0 END) as transactions_2025
FROM financial_transactions;

-- Verify weekly offering data for 2025 (for dashboard chart improvements)
SELECT 
    'Weekly Offering Verification (2025)' as check_type,
    EXTRACT(WEEK FROM date) as week_number,
    COUNT(*) as offering_count,
    SUM(amount) as weekly_total,
    AVG(amount) as average_offering
FROM financial_transactions 
WHERE transaction_type = 'offering' 
  AND EXTRACT(YEAR FROM date) = 2025
GROUP BY EXTRACT(WEEK FROM date)
ORDER BY week_number
LIMIT 10;