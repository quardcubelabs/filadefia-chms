-- Financial Transactions Seed Data for Filadefia CHMS
-- Comprehensive seed data covering all transaction types and scenarios

DO $$
DECLARE
    recorder_id UUID;
    member_ids UUID[];
    dept_youth UUID;
    dept_women UUID;
    dept_men UUID;
    dept_children UUID;
    dept_evangelism UUID;
    dept_choir UUID;
    dept_prayer UUID;
    dept_ushers UUID;
    profile_count INTEGER;
    member_count INTEGER;
BEGIN
    -- Validate required dependencies
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE EXCEPTION 'Table profiles does not exist. Please run member and profile setup first.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'members') THEN
        RAISE EXCEPTION 'Table members does not exist. Please run member setup first.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
        RAISE EXCEPTION 'Table departments does not exist. Please run department setup first.';
    END IF;

    -- Check if we have any profiles to work with
    SELECT COUNT(*) FROM profiles INTO profile_count;
    IF profile_count = 0 THEN
        RAISE EXCEPTION 'No profiles found. Please create user profiles first.';
    END IF;

    -- Check if we have any members to work with  
    SELECT COUNT(*) FROM members INTO member_count;
    IF member_count = 0 THEN
        RAISE EXCEPTION 'No members found. Please create church members first.';
    END IF;

    -- Get a recorder ID (first available profile)
    SELECT id FROM profiles ORDER BY created_at LIMIT 1 INTO recorder_id;
    
    -- Get available member IDs (limit to first 20 for seed data)
    SELECT array_agg(id) FROM (
        SELECT id FROM members ORDER BY created_at LIMIT 20
    ) sub INTO member_ids;
    
    IF array_length(member_ids, 1) < 5 THEN
        RAISE EXCEPTION 'Need at least 5 members for comprehensive financial seed data. Found: %', array_length(member_ids, 1);
    END IF;

    -- Get department IDs (optional - transactions will work without departments)
    SELECT id FROM departments WHERE name ILIKE '%youth%' OR name ILIKE '%young%' LIMIT 1 INTO dept_youth;
    SELECT id FROM departments WHERE name ILIKE '%women%' OR name ILIKE '%ladies%' LIMIT 1 INTO dept_women;  
    SELECT id FROM departments WHERE name ILIKE '%men%' OR name ILIKE '%brother%' LIMIT 1 INTO dept_men;
    SELECT id FROM departments WHERE name ILIKE '%child%' OR name ILIKE '%kids%' LIMIT 1 INTO dept_children;
    SELECT id FROM departments WHERE name ILIKE '%evangel%' OR name ILIKE '%outreach%' LIMIT 1 INTO dept_evangelism;
    SELECT id FROM departments WHERE name ILIKE '%choir%' OR name ILIKE '%music%' OR name ILIKE '%praise%' LIMIT 1 INTO dept_choir;
    SELECT id FROM departments WHERE name ILIKE '%prayer%' OR name ILIKE '%intercession%' LIMIT 1 INTO dept_prayer;
    SELECT id FROM departments WHERE name ILIKE '%usher%' OR name ILIKE '%hospitality%' LIMIT 1 INTO dept_ushers;

    RAISE NOTICE 'Starting financial data seeding...';
    RAISE NOTICE 'Using recorder: %, Available members: %', recorder_id, array_length(member_ids, 1);
    
    -- Clear existing financial transactions (if any)
    DELETE FROM financial_transactions WHERE created_at > '2024-01-01';
    
    -- Insert comprehensive financial transaction data
    INSERT INTO financial_transactions (
        member_id, transaction_type, amount, currency, description, 
        payment_method, reference_number, department_id, date, 
        recorded_by, verified, verified_by, verified_at
    ) VALUES 
    -- TITHE TRANSACTIONS (2024-2025)
    (member_ids[1], 'tithe', 120000.00, 'TZS', 'Monthly Tithe - January', 'M-Pesa', 'MP240101001', NULL, '2024-01-01', recorder_id, true, recorder_id, '2024-01-01 10:30:00'),
    (member_ids[2], 'tithe', 85000.00, 'TZS', 'Monthly Tithe - January', 'Cash', NULL, NULL, '2024-01-07', recorder_id, true, recorder_id, '2024-01-07 11:15:00'),
    (member_ids[3], 'tithe', 200000.00, 'TZS', 'Quarterly Tithe', 'Bank Transfer', 'BT240110001', NULL, '2024-01-10', recorder_id, true, recorder_id, '2024-01-10 14:20:00'),
    (member_ids[4], 'tithe', 150000.00, 'TZS', 'Monthly Tithe - February', 'TigoPesa', 'TP240201001', NULL, '2024-02-01', recorder_id, true, recorder_id, '2024-02-01 09:45:00'),
    (member_ids[5], 'tithe', 95000.00, 'TZS', 'Monthly Tithe - February', 'Airtel Money', 'AM240205001', NULL, '2024-02-05', recorder_id, true, recorder_id, '2024-02-05 13:00:00'),
    
    -- SUNDAY OFFERINGS (Recent and Historical)
    (member_ids[1], 'offering', 25000.00, 'TZS', 'Sunday Service Offering', 'Cash', NULL, NULL, '2024-11-03', recorder_id, true, recorder_id, '2024-11-03 12:00:00'),
    (member_ids[2], 'offering', 15000.00, 'TZS', 'Sunday Service Offering', 'M-Pesa', 'MP241103001', NULL, '2024-11-03', recorder_id, true, recorder_id, '2024-11-03 12:05:00'),
    (member_ids[3], 'offering', 35000.00, 'TZS', 'Sunday Service Offering', 'TigoPesa', 'TP241103001', NULL, '2024-11-03', recorder_id, true, recorder_id, '2024-11-03 12:10:00'),
    (member_ids[4], 'offering', 20000.00, 'TZS', 'Sunday Service Offering', 'Cash', NULL, NULL, '2024-11-10', recorder_id, true, recorder_id, '2024-11-10 12:00:00'),
    (member_ids[5], 'offering', 40000.00, 'TZS', 'Sunday Service Offering', 'Airtel Money', 'AM241110001', NULL, '2024-11-10', recorder_id, true, recorder_id, '2024-11-10 12:15:00'),
    
    -- DONATIONS (Various Purposes)
    (member_ids[1], 'donation', 500000.00, 'TZS', 'Church Building Fund', 'Bank Transfer', 'BT241001001', NULL, '2024-10-01', recorder_id, true, recorder_id, '2024-10-01 16:30:00'),
    (member_ids[2], 'donation', 250000.00, 'TZS', 'Sound System Upgrade', 'Cheque', 'CHQ241015001', NULL, '2024-10-15', recorder_id, false, NULL, NULL),
    (member_ids[3], 'donation', 180000.00, 'TZS', 'Church Van Fund', 'M-Pesa', 'MP241020001', NULL, '2024-10-20', recorder_id, true, recorder_id, '2024-10-20 14:45:00'),
    (member_ids[4], 'donation', 75000.00, 'TZS', 'Emergency Relief Fund', 'Cash', NULL, NULL, '2024-11-01', recorder_id, true, recorder_id, '2024-11-01 10:00:00'),
    (member_ids[5], 'donation', 300000.00, 'TZS', 'Youth Conference Sponsorship', 'Bank Transfer', 'BT241105001', dept_youth, '2024-11-05', recorder_id, true, recorder_id, '2024-11-05 11:30:00'),
    
    -- PROJECT FUNDS
    (member_ids[1], 'project', 150000.00, 'TZS', 'Church Expansion Project Phase 1', 'M-Pesa', 'MP241001002', NULL, '2024-10-01', recorder_id, true, recorder_id, '2024-10-01 17:00:00'),
    (member_ids[2], 'project', 200000.00, 'TZS', 'New Sanctuary Seating', 'TigoPesa', 'TP241010001', NULL, '2024-10-10', recorder_id, true, recorder_id, '2024-10-10 15:20:00'),
    (member_ids[3], 'project', 85000.00, 'TZS', 'Kitchen Renovation Project', 'Cash', NULL, NULL, '2024-10-25', recorder_id, true, recorder_id, '2024-10-25 13:45:00'),
    (member_ids[4], 'project', 320000.00, 'TZS', 'Church Compound Wall', 'Bank Transfer', 'BT241030001', NULL, '2024-10-30', recorder_id, true, recorder_id, '2024-10-30 09:15:00'),
    
    -- PLEDGES (Commitment-based giving)
    (member_ids[1], 'pledge', 100000.00, 'TZS', 'Annual Building Fund Pledge - Q4', 'Cheque', 'CHQ241101001', NULL, '2024-11-01', recorder_id, true, recorder_id, '2024-11-01 15:00:00'),
    (member_ids[2], 'pledge', 50000.00, 'TZS', 'Monthly Mission Pledge', 'M-Pesa', 'MP241105002', NULL, '2024-11-05', recorder_id, true, recorder_id, '2024-11-05 12:30:00'),
    (member_ids[3], 'pledge', 75000.00, 'TZS', 'Youth Department Annual Pledge', 'Airtel Money', 'AM241107001', dept_youth, '2024-11-07', recorder_id, true, recorder_id, '2024-11-07 16:45:00'),
    
    -- MISSION & EVANGELISM
    (member_ids[1], 'mission', 200000.00, 'TZS', 'Rural Evangelism Campaign', 'Bank Transfer', 'BT240915001', dept_evangelism, '2024-09-15', recorder_id, true, recorder_id, '2024-09-15 10:00:00'),
    (member_ids[2], 'mission', 150000.00, 'TZS', 'International Mission Support', 'M-Pesa', 'MP240920001', dept_evangelism, '2024-09-20', recorder_id, true, recorder_id, '2024-09-20 14:30:00'),
    (member_ids[3], 'mission', 80000.00, 'TZS', 'Local Outreach Program', 'Cash', NULL, dept_evangelism, '2024-10-05', recorder_id, true, recorder_id, '2024-10-05 11:15:00'),
    (member_ids[4], 'mission', 125000.00, 'TZS', 'Missionary Support Fund', 'TigoPesa', 'TP241025001', dept_evangelism, '2024-10-25', recorder_id, true, recorder_id, '2024-10-25 13:00:00'),
    
    -- WELFARE & ASSISTANCE  
    (member_ids[1], 'welfare', 60000.00, 'TZS', 'Widows & Orphans Support', 'Cash', NULL, NULL, '2024-09-01', recorder_id, true, recorder_id, '2024-09-01 14:00:00'),
    (member_ids[2], 'welfare', 45000.00, 'TZS', 'Medical Emergency Assistance', 'M-Pesa', 'MP240910001', NULL, '2024-09-10', recorder_id, true, recorder_id, '2024-09-10 16:20:00'),
    (member_ids[3], 'welfare', 90000.00, 'TZS', 'Educational Support Fund', 'Bank Transfer', 'BT240920002', NULL, '2024-09-20', recorder_id, true, recorder_id, '2024-09-20 10:45:00'),
    (member_ids[4], 'welfare', 35000.00, 'TZS', 'Food Relief Program', 'Airtel Money', 'AM241001001', NULL, '2024-10-01', recorder_id, true, recorder_id, '2024-10-01 12:00:00'),
    
    -- DEPARTMENT-SPECIFIC CONTRIBUTIONS
    -- Youth Department
    (member_ids[1], 'donation', 80000.00, 'TZS', 'Youth Conference 2024', 'M-Pesa', 'MP240801001', dept_youth, '2024-08-01', recorder_id, true, recorder_id, '2024-08-01 15:30:00'),
    (member_ids[2], 'donation', 45000.00, 'TZS', 'Youth Ministry Equipment', 'Cash', NULL, dept_youth, '2024-08-15', recorder_id, true, recorder_id, '2024-08-15 17:00:00'),
    
    -- Women's Department  
    (member_ids[3], 'donation', 95000.00, 'TZS', 'Women Fellowship Annual Event', 'TigoPesa', 'TP240715001', dept_women, '2024-07-15', recorder_id, true, recorder_id, '2024-07-15 13:45:00'),
    (member_ids[4], 'donation', 65000.00, 'TZS', 'Mothers Day Special Collection', 'Cheque', 'CHQ240512001', dept_women, '2024-05-12', recorder_id, true, recorder_id, '2024-05-12 11:30:00'),
    
    -- Men's Department
    (member_ids[5], 'donation', 120000.00, 'TZS', 'Men Brotherhood Project', 'Bank Transfer', 'BT240601001', dept_men, '2024-06-01', recorder_id, true, recorder_id, '2024-06-01 09:00:00'),
    (member_ids[1], 'donation', 85000.00, 'TZS', 'Fathers Day Fundraiser', 'M-Pesa', 'MP240616001', dept_men, '2024-06-16', recorder_id, true, recorder_id, '2024-06-16 14:15:00'),
    
    -- Choir & Music Ministry
    (member_ids[2], 'donation', 75000.00, 'TZS', 'New Musical Instruments', 'Airtel Money', 'AM240401001', dept_choir, '2024-04-01', recorder_id, true, recorder_id, '2024-04-01 16:00:00'),
    (member_ids[3], 'donation', 50000.00, 'TZS', 'Choir Uniforms Fund', 'Cash', NULL, dept_choir, '2024-04-20', recorder_id, true, recorder_id, '2024-04-20 12:45:00'),
    
    -- EXPENSES (Church Operations)
    (member_ids[1], 'expense', 180000.00, 'TZS', 'Monthly Electricity Bill', 'Bank Transfer', 'BT241101002', NULL, '2024-11-01', recorder_id, true, recorder_id, '2024-11-01 08:30:00'),
    (member_ids[2], 'expense', 85000.00, 'TZS', 'Water Bill - October', 'M-Pesa', 'MP241105003', NULL, '2024-11-05', recorder_id, true, recorder_id, '2024-11-05 10:15:00'),
    (member_ids[3], 'expense', 250000.00, 'TZS', 'Sound System Maintenance', 'Cash', NULL, NULL, '2024-11-08', recorder_id, true, recorder_id, '2024-11-08 14:00:00'),
    (member_ids[4], 'expense', 120000.00, 'TZS', 'Church Cleaning Services', 'TigoPesa', 'TP241110002', NULL, '2024-11-10', recorder_id, true, recorder_id, '2024-11-10 09:30:00'),
    (member_ids[5], 'expense', 65000.00, 'TZS', 'Office Supplies & Stationery', 'Airtel Money', 'AM241112001', NULL, '2024-11-12', recorder_id, true, recorder_id, '2024-11-12 11:00:00'),
    
    -- RECENT TRANSACTIONS (November 2024 - Current)
    (member_ids[1], 'tithe', 125000.00, 'TZS', 'November Tithe', 'Bank Transfer', 'BT241115001', NULL, '2024-11-15', recorder_id, true, recorder_id, '2024-11-15 15:45:00'),
    (member_ids[2], 'offering', 28000.00, 'TZS', 'Thanksgiving Service Offering', 'M-Pesa', 'MP241117001', NULL, '2024-11-17', recorder_id, true, recorder_id, '2024-11-17 12:30:00'),
    (member_ids[3], 'donation', 200000.00, 'TZS', 'Year-end Building Fund', 'Cheque', 'CHQ241120001', NULL, '2024-11-20', recorder_id, false, NULL, NULL),
    
    -- FUTURE DATED TRANSACTIONS (2025 Preview)
    (member_ids[1], 'pledge', 300000.00, 'TZS', 'Annual Pledge 2025 - Q1', 'Bank Transfer', 'BT250101001', NULL, '2025-01-01', recorder_id, false, NULL, NULL),
    (member_ids[2], 'project', 150000.00, 'TZS', 'New Year Building Project', 'M-Pesa', 'MP250115001', NULL, '2025-01-15', recorder_id, false, NULL, NULL),
    (member_ids[3], 'expense', 95000.00, 'TZS', 'January Utilities', 'Cash', NULL, NULL, '2025-02-01', recorder_id, false, NULL, NULL),
    (member_ids[4], 'mission', 180000.00, 'TZS', '2025 Mission Campaign Launch', 'TigoPesa', 'TP250201001', dept_evangelism, '2025-02-01', recorder_id, false, NULL, NULL),
    (member_ids[5], 'expense', 320000.00, 'TZS', 'Building Maintenance Q1', 'Cheque', 'CHQ250315001', NULL, '2025-03-15', recorder_id, true, recorder_id, '2025-03-15 14:30:00'),
    (NULL, 'expense', 95000.00, 'TZS', 'Office Supplies', 'Cash', NULL, NULL, '2025-04-01', recorder_id, true, recorder_id, '2025-04-01 09:15:00');

    RAISE NOTICE 'Successfully inserted comprehensive financial transaction data!';
    RAISE NOTICE 'Added transactions covering all types: tithe, offering, donation, project, pledge, mission, welfare, expense';
    RAISE NOTICE 'Payment methods: Cash, M-Pesa, TigoPesa, Airtel Money, Bank Transfer, Cheque';
    RAISE NOTICE 'Date range: 2024-2025 with recent transactions up to November 2025';
END $$;