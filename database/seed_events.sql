-- FCC Church Management System - Events Seeding Script
-- Run this script in Supabase SQL Editor to create 10 sample events

-- Note: Replace 'YOUR_USER_ID' with an actual user ID from your profiles table
-- You can find user IDs by running: SELECT id, first_name, last_name FROM profiles LIMIT 5;

-- First, let's get a sample user ID and department ID (uncomment to see available IDs)
-- SELECT 'Available Users:' as info;
-- SELECT id, first_name, last_name, email FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 5;
-- 
-- SELECT 'Available Departments:' as info;
-- SELECT id, name FROM departments WHERE is_active = true LIMIT 5;

-- Insert 10 sample events
-- Replace the organizer_id and department_id values with actual IDs from your database

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
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE is_active = true LIMIT 1),
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
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE is_active = true LIMIT 1),
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
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
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
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE is_active = true LIMIT 1),
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
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE is_active = true LIMIT 1),
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
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
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
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE is_active = true LIMIT 1),
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
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE is_active = true LIMIT 1),
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
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
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
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE is_active = true LIMIT 1),
  300,
  false,
  NULL,
  10000,
  true
);

-- Verify the events were created
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
  is_active
FROM events 
ORDER BY start_date;

-- Show count of events by type
SELECT 
  event_type,
  COUNT(*) as count
FROM events 
GROUP BY event_type
ORDER BY count DESC;