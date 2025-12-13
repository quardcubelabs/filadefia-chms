-- FCC Church Management System - Events Seeding Script (Manual ID Version)
-- Run this script in Supabase SQL Editor to create 10 sample events
-- 
-- INSTRUCTIONS:
-- 1. First, find available user and department IDs by running the queries below
-- 2. Replace the placeholder IDs in the INSERT statements with actual IDs
-- 3. Run the INSERT statements

-- STEP 1: Find available user IDs (organizers)
SELECT 'Available Users (Organizers):' as info, '' as id, '' as name, '' as email;
SELECT 
  id, 
  CONCAT(first_name, ' ', last_name) as name, 
  email,
  role
FROM profiles 
WHERE role IN ('administrator', 'pastor', 'department_leader') 
ORDER BY role, first_name
LIMIT 10;

-- STEP 2: Find available department IDs
SELECT 'Available Departments:' as info, '' as id, '' as name;
SELECT 
  id, 
  name
FROM departments 
WHERE is_active = true 
ORDER BY name
LIMIT 10;

-- STEP 3: Replace 'YOUR_USER_ID_HERE' and 'YOUR_DEPARTMENT_ID_HERE' with actual IDs from above
-- Then run the INSERT statements below:

/*
INSERT INTO events (
  title,
  description,
  event_type,
  start_date,
  end_date,
  location,
  organizer_id,
  department_id,
  max_attendees,
  registration_required,
  registration_deadline,
  cost,
  is_active
) VALUES 
-- Event 1: Sunday Worship Service
(
  'Sunday Worship Service',
  'Weekly Sunday worship service with praise, worship, and sermon',
  'fellowship',
  '2024-12-15 09:00:00+00',
  '2024-12-15 11:30:00+00',
  'Main Sanctuary',
  'YOUR_USER_ID_HERE',  -- Replace with actual user ID
  'YOUR_DEPARTMENT_ID_HERE',  -- Replace with actual department ID
  500,
  false,
  NULL,
  0,
  true
),

-- Event 2: Youth Conference 2024
(
  'Youth Conference 2024',
  'Annual youth conference focusing on spiritual growth and leadership development',
  'conference',
  '2024-12-20 08:00:00+00',
  '2024-12-22 18:00:00+00',
  'Conference Hall',
  'YOUR_USER_ID_HERE',  -- Replace with actual user ID
  'YOUR_DEPARTMENT_ID_HERE',  -- Replace with actual department ID
  200,
  true,
  '2024-12-18 23:59:59+00',
  50000,
  true
),

-- Event 3: Prayer Night - Revival Fire
(
  'Prayer Night - Revival Fire',
  'Intercessory prayer night seeking God''s revival in our community',
  'prayer_night',
  '2024-12-25 19:00:00+00',
  '2024-12-25 23:00:00+00',
  'Prayer Garden',
  'YOUR_USER_ID_HERE',  -- Replace with actual user ID
  NULL,  -- No department for this event
  100,
  false,
  NULL,
  0,
  true
),

-- Event 4: Marriage Enrichment Workshop
(
  'Marriage Enrichment Workshop',
  'Workshop for married couples to strengthen their relationships through biblical principles',
  'workshop',
  '2024-12-28 14:00:00+00',
  '2024-12-28 17:00:00+00',
  'Fellowship Hall A',
  'YOUR_USER_ID_HERE',  -- Replace with actual user ID
  'YOUR_DEPARTMENT_ID_HERE',  -- Replace with actual department ID
  50,
  true,
  '2024-12-26 23:59:59+00',
  25000,
  true
),

-- Event 5: Leadership Training Seminar
(
  'Leadership Training Seminar',
  'Equipping church leaders with practical leadership skills and biblical foundation',
  'seminar',
  '2025-01-05 09:00:00+00',
  '2025-01-05 16:00:00+00',
  'Conference Room B',
  'YOUR_USER_ID_HERE',  -- Replace with actual user ID
  'YOUR_DEPARTMENT_ID_HERE',  -- Replace with actual department ID
  30,
  true,
  '2025-01-03 23:59:59+00',
  75000,
  true
),

-- Event 6: Community Outreach Crusade
(
  'Community Outreach Crusade',
  'Evangelistic crusade reaching out to the local community with the Gospel message',
  'crusade',
  '2025-01-10 16:00:00+00',
  '2025-01-12 20:00:00+00',
  'City Stadium',
  'YOUR_USER_ID_HERE',  -- Replace with actual user ID
  NULL,  -- No department for this event
  5000,
  false,
  NULL,
  0,
  true
),

-- Event 7: Women's Fellowship Breakfast
(
  'Women''s Fellowship Breakfast',
  'Monthly fellowship breakfast for women with testimonies and encouragement',
  'fellowship',
  '2025-01-15 08:00:00+00',
  '2025-01-15 11:00:00+00',
  'Fellowship Hall B',
  'YOUR_USER_ID_HERE',  -- Replace with actual user ID
  'YOUR_DEPARTMENT_ID_HERE',  -- Replace with actual department ID
  80,
  true,
  '2025-01-13 23:59:59+00',
  15000,
  true
),

-- Event 8: Bible Study Workshop - Book of Romans
(
  'Bible Study Workshop - Book of Romans',
  'In-depth study of the Book of Romans with interactive discussions and practical applications',
  'workshop',
  '2025-01-18 10:00:00+00',
  '2025-01-18 15:00:00+00',
  'Study Room 1',
  'YOUR_USER_ID_HERE',  -- Replace with actual user ID
  'YOUR_DEPARTMENT_ID_HERE',  -- Replace with actual department ID
  40,
  true,
  '2025-01-16 23:59:59+00',
  20000,
  true
),

-- Event 9: New Year Prayer & Fasting Conference
(
  'New Year Prayer & Fasting Conference',
  '21-day prayer and fasting conference to start the new year with spiritual breakthrough',
  'conference',
  '2025-01-01 06:00:00+00',
  '2025-01-21 21:00:00+00',
  'Main Sanctuary & Online',
  'YOUR_USER_ID_HERE',  -- Replace with actual user ID
  NULL,  -- No department for this event
  1000,
  true,
  '2024-12-30 23:59:59+00',
  0,
  true
),

-- Event 10: Youth Talent Night
(
  'Youth Talent Night',
  'Showcase of talents by church youth including music, drama, poetry, and testimonies',
  'fellowship',
  '2025-01-25 18:00:00+00',
  '2025-01-25 21:00:00+00',
  'Main Sanctuary',
  'YOUR_USER_ID_HERE',  -- Replace with actual user ID
  'YOUR_DEPARTMENT_ID_HERE',  -- Replace with actual department ID
  300,
  false,
  NULL,
  10000,
  true
);
*/

-- STEP 4: After inserting the events, run these queries to verify:

-- Show all created events
SELECT 
  id,
  title,
  event_type,
  start_date,
  end_date,
  location,
  max_attendees,
  registration_required,
  cost,
  is_active,
  created_at
FROM events 
ORDER BY start_date;

-- Show events by type
SELECT 
  event_type,
  COUNT(*) as count
FROM events 
GROUP BY event_type
ORDER BY count DESC;

-- Show events with organizer and department info
SELECT 
  e.title,
  e.event_type,
  e.start_date,
  e.location,
  CONCAT(p.first_name, ' ', p.last_name) as organizer,
  d.name as department
FROM events e
LEFT JOIN profiles p ON e.organizer_id = p.id
LEFT JOIN departments d ON e.department_id = d.id
ORDER BY e.start_date;