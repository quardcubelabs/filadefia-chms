-- FCC Church Management System Seed Data
-- Sample data for testing and development

-- Note: This is sample data for development purposes only
-- In production, real member data should be entered through the application

-- Sample profiles (will need to be linked to actual Supabase auth users)
-- This is just for reference - actual profiles will be created through auth signup

-- Sample members
INSERT INTO members (
  member_number, first_name, last_name, gender, date_of_birth, marital_status,
  phone, email, address, emergency_contact_name, emergency_contact_phone,
  baptism_date, membership_date, status
) VALUES
('FCC001', 'John', 'Mwanga', 'male', '1985-03-15', 'married', '+255712345001', 'john.mwanga@example.com', 'Kinondoni, Dar es Salaam', 'Mary Mwanga', '+255712345002', '2010-05-20', '2008-01-15', 'active'),
('FCC002', 'Grace', 'Nkomo', 'female', '1990-07-22', 'single', '+255723456789', 'grace.nkomo@example.com', 'Temeke, Dar es Salaam', 'Peter Nkomo', '+255723456790', '2015-08-10', '2014-03-20', 'active'),
('FCC003', 'David', 'Kimaro', 'male', '1978-11-08', 'married', '+255734567890', 'david.kimaro@example.com', 'Ilala, Dar es Salaam', 'Sarah Kimaro', '+255734567891', '2005-12-25', '2003-06-10', 'active'),
('FCC004', 'Esther', 'Moshi', 'female', '1988-04-12', 'married', '+255745678901', 'esther.moshi@example.com', 'Mbeya', 'Joseph Moshi', '+255745678902', '2012-04-08', '2011-09-15', 'active'),
('FCC005', 'Samuel', 'Ngozi', 'male', '1995-09-03', 'single', '+255756789012', 'samuel.ngozi@example.com', 'Arusha', 'Grace Ngozi', '+255756789013', '2018-07-15', '2017-11-20', 'active'),
('FCC006', 'Ruth', 'Mbeya', 'female', '1982-06-18', 'divorced', '+255767890123', 'ruth.mbeya@example.com', 'Mwanza', 'John Mbeya', '+255767890124', '2008-03-30', '2006-08-05', 'active'),
('FCC007', 'Paul', 'Songea', 'male', '1992-12-25', 'single', '+255778901234', 'paul.songea@example.com', 'Dodoma', 'Mary Songea', '+255778901235', '2019-12-15', '2018-05-10', 'active'),
('FCC008', 'Deborah', 'Tanga', 'female', '1987-02-14', 'married', '+255789012345', 'deborah.tanga@example.com', 'Moshi, Kilimanjaro', 'Daniel Tanga', '+255789012346', '2013-06-20', '2012-01-25', 'active'),
('FCC009', 'Timothy', 'Iringa', 'male', '1980-10-30', 'married', '+255790123456', 'timothy.iringa@example.com', 'Iringa', 'Faith Iringa', '+255790123457', '2007-09-12', '2005-12-08', 'active'),
('FCC010', 'Martha', 'Singida', 'female', '1993-08-07', 'single', '+255701234567', 'martha.singida@example.com', 'Singida', 'Paul Singida', '+255701234568', '2020-01-10', '2019-03-15', 'active');

-- Assign members to departments
-- Youth Department (ages 15-35, roughly)
INSERT INTO department_members (department_id, member_id, position) 
SELECT d.id, m.id, 'member'
FROM departments d, members m 
WHERE d.name = 'Youth Department' 
AND m.member_number IN ('FCC002', 'FCC005', 'FCC007', 'FCC010');

-- Update one youth member as chairperson
UPDATE department_members 
SET position = 'chairperson'
WHERE department_id = (SELECT id FROM departments WHERE name = 'Youth Department')
AND member_id = (SELECT id FROM members WHERE member_number = 'FCC005');

-- Women's Department
INSERT INTO department_members (department_id, member_id, position)
SELECT d.id, m.id, 'member'
FROM departments d, members m
WHERE d.name = 'Women''s Department'
AND m.gender = 'female';

-- Update one woman as chairperson
UPDATE department_members
SET position = 'chairperson'
WHERE department_id = (SELECT id FROM departments WHERE name = 'Women''s Department')
AND member_id = (SELECT id FROM members WHERE member_number = 'FCC004');

-- Men's Department
INSERT INTO department_members (department_id, member_id, position)
SELECT d.id, m.id, 'member'
FROM departments d, members m
WHERE d.name = 'Men''s Department'
AND m.gender = 'male';

-- Update one man as chairperson
UPDATE department_members
SET position = 'chairperson'
WHERE department_id = (SELECT id FROM departments WHERE name = 'Men''s Department')
AND member_id = (SELECT id FROM members WHERE member_number = 'FCC003');

-- Choir & Praise Team (sample members)
INSERT INTO department_members (department_id, member_id, position)
SELECT d.id, m.id, 'member'
FROM departments d, members m
WHERE d.name = 'Choir & Praise Team'
AND m.member_number IN ('FCC001', 'FCC002', 'FCC008', 'FCC009');

-- Sample attendance records for the last month
INSERT INTO attendance (member_id, attendance_type, date, present)
SELECT 
  m.id,
  'sunday_service',
  CURRENT_DATE - INTERVAL '7 days' * s.week,
  CASE WHEN random() > 0.2 THEN true ELSE false END -- 80% attendance rate
FROM members m
CROSS JOIN generate_series(0, 3) s(week);

-- Sample financial transactions
INSERT INTO financial_transactions (
  member_id, transaction_type, amount, description, payment_method, date, 
  recorded_by, verified
) VALUES
-- Tithes
((SELECT id FROM members WHERE member_number = 'FCC001'), 'tithe', 50000.00, 'Monthly tithe', 'M-Pesa', CURRENT_DATE - INTERVAL '1 day', (SELECT id FROM members WHERE member_number = 'FCC001'), true),
((SELECT id FROM members WHERE member_number = 'FCC003'), 'tithe', 75000.00, 'Monthly tithe', 'Cash', CURRENT_DATE - INTERVAL '2 days', (SELECT id FROM members WHERE member_number = 'FCC003'), true),
((SELECT id FROM members WHERE member_number = 'FCC004'), 'tithe', 60000.00, 'Monthly tithe', 'TigoPesa', CURRENT_DATE - INTERVAL '3 days', (SELECT id FROM members WHERE member_number = 'FCC004'), true),

-- Offerings
((SELECT id FROM members WHERE member_number = 'FCC002'), 'offering', 10000.00, 'Sunday offering', 'Cash', CURRENT_DATE, (SELECT id FROM members WHERE member_number = 'FCC002'), true),
((SELECT id FROM members WHERE member_number = 'FCC005'), 'offering', 15000.00, 'Sunday offering', 'M-Pesa', CURRENT_DATE, (SELECT id FROM members WHERE member_number = 'FCC005'), true),

-- Donations
((SELECT id FROM members WHERE member_number = 'FCC006'), 'donation', 100000.00, 'Church building fund', 'Bank Transfer', CURRENT_DATE - INTERVAL '5 days', (SELECT id FROM members WHERE member_number = 'FCC006'), true),

-- Expenses
(NULL, 'expense', 25000.00, 'Sound system maintenance', 'Cash', CURRENT_DATE - INTERVAL '1 day', (SELECT id FROM members WHERE member_number = 'FCC001'), true),
(NULL, 'expense', 45000.00, 'Church utilities bill', 'Bank Transfer', CURRENT_DATE - INTERVAL '3 days', (SELECT id FROM members WHERE member_number = 'FCC001'), true);

-- Sample events
INSERT INTO events (
  title, description, event_type, start_date, end_date, location, 
  organizer_id, registration_required
) VALUES
('Youth Conference 2024', 'Annual youth conference for spiritual growth and fellowship', 'conference', 
 CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '32 days', 'FCC Main Auditorium', 
 (SELECT id FROM members WHERE member_number = 'FCC005'), true),

('Women''s Prayer Retreat', 'Special prayer and fasting retreat for women', 'retreat', 
 CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '16 days', 'FCC Prayer Hall', 
 (SELECT id FROM members WHERE member_number = 'FCC004'), true),

('Evangelism Crusade', 'Community outreach and evangelism event', 'crusade', 
 CURRENT_DATE + INTERVAL '20 days', CURRENT_DATE + INTERVAL '20 days', 'Kinondoni Community Center', 
 (SELECT id FROM members WHERE member_number = 'FCC003'), false),

('Monthly Prayer Night', 'All-night prayer session', 'prayer_night', 
 CURRENT_DATE + INTERVAL '7 days' + INTERVAL '20 hours', CURRENT_DATE + INTERVAL '8 days' + INTERVAL '6 hours', 'FCC Main Sanctuary', 
 (SELECT id FROM members WHERE member_number = 'FCC001'), false);

-- Sample announcements
INSERT INTO announcements (title, content, author_id, priority) VALUES
('Church Building Project Update', 
 'Dear FCC family, we are pleased to announce that our building project is 75% complete. Thank you for your continued support and prayers.',
 (SELECT id FROM members WHERE member_number = 'FCC001'), 'high'),

('New Bible Study Groups', 
 'We are starting new home Bible study groups in different areas of the city. Please contact your department leaders for more information.',
 (SELECT id FROM members WHERE member_number = 'FCC003'), 'medium'),

('Youth Department Meeting', 
 'All youth members are invited to a special planning meeting this Saturday at 2 PM. We will discuss upcoming events and activities.',
 (SELECT id FROM members WHERE member_number = 'FCC005'), 'medium');

-- Sample pledges
INSERT INTO pledges (member_id, title, total_amount, start_date, end_date) VALUES
((SELECT id FROM members WHERE member_number = 'FCC001'), 'Building Fund Pledge', 500000.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '12 months'),
((SELECT id FROM members WHERE member_number = 'FCC003'), 'Mission Support Pledge', 300000.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months'),
((SELECT id FROM members WHERE member_number = 'FCC006'), 'Youth Ministry Pledge', 200000.00, CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '4 months');

-- Update some pledges with partial payments
UPDATE pledges SET paid_amount = 150000.00 WHERE member_id = (SELECT id FROM members WHERE member_number = 'FCC001');
UPDATE pledges SET paid_amount = 100000.00 WHERE member_id = (SELECT id FROM members WHERE member_number = 'FCC003');
UPDATE pledges SET paid_amount = 50000.00 WHERE member_id = (SELECT id FROM members WHERE member_number = 'FCC006');

-- Sample meeting minutes
INSERT INTO meeting_minutes (
  department_id, meeting_date, agenda, minutes, attendees, recorded_by
) VALUES
((SELECT id FROM departments WHERE name = 'Youth Department'),
 CURRENT_DATE - INTERVAL '7 days',
 'Planning for Youth Conference 2024',
 'Meeting opened with prayer. Discussed venue, speakers, and budget for the upcoming youth conference. Formed planning committees for different aspects of the event.',
 ARRAY[(SELECT id FROM members WHERE member_number = 'FCC005'), (SELECT id FROM members WHERE member_number = 'FCC002'), (SELECT id FROM members WHERE member_number = 'FCC007')],
 (SELECT id FROM members WHERE member_number = 'FCC005'));

-- Sample event registrations
INSERT INTO event_registrations (event_id, member_id) 
SELECT e.id, m.id 
FROM events e, members m 
WHERE e.title = 'Youth Conference 2024' 
AND m.member_number IN ('FCC002', 'FCC005', 'FCC007', 'FCC010');