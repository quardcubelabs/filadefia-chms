-- Update script to add new members to existing database
-- This script safely adds members without clearing existing data
-- Run this if you want to add more members to your current database

-- First, let's check what member numbers already exist and add new ones
-- Starting from FCC101 to avoid conflicts

-- Insert additional members (FCC101-FCC150) with unique member numbers
INSERT INTO members (
  member_number, first_name, last_name, middle_name, gender, date_of_birth, 
  marital_status, phone, email, address, occupation, employer, 
  emergency_contact_name, emergency_contact_phone, baptism_date, membership_date, status
) VALUES
-- New Members 101-110
('FCC101', 'Joshua', 'Mwakasitu', 'Emmanuel', 'male', '1986-03-20', 'married', '+255789567123', 'joshua.mwakasitu@gmail.com', 'Kariakoo Plaza, Dar es Salaam', 'Electronics Technician', 'Vodacom Tanzania', 'Grace Mwakasitu', '+255789567124', '2021-08-15', '2021-07-01', 'active'),
('FCC102', 'Martha', 'Mwakabila', 'Hope', 'female', '1991-11-08', 'single', '+255756234890', 'martha.mwakabila@yahoo.com', 'Sinza Kati, Dar es Salaam', 'Laboratory Technician', 'Ocean Road Hospital', 'Peter Mwakabila', '+255756234891', '2022-04-10', '2022-03-15', 'active'),
('FCC103', 'Samson', 'Mwakalole', 'Strength', 'male', '1984-07-14', 'married', '+255765345901', 'samson.mwakalole@outlook.com', 'Mbezi Beach, Dar es Salaam', 'Sports Coach', 'National Stadium', 'Ruth Mwakalole', '+255765345902', '2020-12-05', '2020-11-10', 'active'),
('FCC104', 'Rebecca', 'Mwakanyamale', 'Faith', 'female', '1993-05-27', 'single', '+255784456912', 'rebecca.mwakanyamale@gmail.com', 'Mwenge Africana, Dar es Salaam', 'Fashion Designer', 'Creative Studio', 'John Mwakanyamale', '+255784456913', '2023-01-18', '2022-12-28', 'active'),
('FCC105', 'Elias', 'Mwakatumbila', 'God is Salvation', 'male', '1988-09-02', 'married', '+255773567923', 'elias.mwakatumbila@hotmail.com', 'Tabata Relini, Dar es Salaam', 'Physiotherapist', 'Muhimbili Orthopedic Institute', 'Sarah Mwakatumbila', '+255773567924', '2021-06-20', '2021-05-05', 'active'),
('FCC106', 'Doreen', 'Mwakabonga', 'Gift', 'female', '1995-12-15', 'single', '+255762678934', 'doreen.mwakabonga@gmail.com', 'Kimara Mwisho, Dar es Salaam', 'Veterinary Officer', 'Ministry of Livestock', 'James Mwakabonga', '+255762678935', '2023-07-08', '2023-06-20', 'active'),
('FCC107', 'Caleb', 'Mwakalindile', 'Wholehearted', 'male', '1982-04-11', 'married', '+255751789045', 'caleb.mwakalindile@yahoo.com', 'Mbagala Chamazi, Dar es Salaam', 'Immigration Officer', 'Immigration Department', 'Mary Mwakalindile', '+255751789046', '2019-09-15', '2019-08-01', 'active'),
('FCC108', 'Lydia', 'Mwakatobe', 'Noble', 'female', '1990-01-30', 'married', '+255740890156', 'lydia.mwakatobe@outlook.com', 'Kinondoni Mazizini, Dar es Salaam', 'Nutritionist', 'TFNC', 'David Mwakatobe', '+255740890157', '2021-11-25', '2021-10-15', 'active'),
('FCC109', 'Solomon', 'Mwakalanga', 'Peace', 'male', '1987-08-23', 'married', '+255729901167', 'solomon.mwakalanga@gmail.com', 'Ubungo Msewe, Dar es Salaam', 'Customs Officer', 'Tanzania Revenue Authority', 'Esther Mwakalanga', '+255729901168', '2020-05-30', '2020-04-12', 'active'),
('FCC110', 'Priscilla', 'Mwakatundu', 'Ancient', 'female', '1994-10-06', 'single', '+255718012178', 'priscilla.mwakatundu@hotmail.com', 'Magomeni Mapipa, Dar es Salaam', 'Environmental Officer', 'NEMC', 'Michael Mwakatundu', '+255718012179', '2022-12-12', '2022-11-25', 'active'),

-- New Members 111-120
('FCC111', 'Barnabas', 'Mwakalole', 'Son of Encouragement', 'male', '1985-06-18', 'married', '+255707123189', 'barnabas.mwakalole@gmail.com', 'Kimara Korogwe, Dar es Salaam', 'Forest Officer', 'Tanzania Forest Service', 'Hannah Mwakalole', '+255707123190', '2020-03-22', '2020-02-10', 'active'),
('FCC112', 'Tabitha', 'Mwakatumbuka', 'Gazelle', 'female', '1992-03-12', 'single', '+255696234201', 'tabitha.mwakatumbuka@yahoo.com', 'Mwananyamala Goba, Dar es Salaam', 'Meteorologist', 'Tanzania Meteorological Authority', 'Paul Mwakatumbuka', '+255696234202', '2022-08-14', '2022-07-28', 'active'),
('FCC113', 'Silas', 'Mwakanyongo', 'Forest', 'male', '1989-12-05', 'married', '+255685345212', 'silas.mwakanyongo@outlook.com', 'Mbezi Juu Mpakani, Dar es Salaam', 'Geologist', 'Tanzania Mineral Resources', 'Grace Mwakanyongo', '+255685345213', '2021-04-18', '2021-03-30', 'active'),
('FCC114', 'Dorcas', 'Mwakalamba', 'Gazelle', 'female', '1996-07-22', 'single', '+255674456223', 'dorcas.mwakalamba@gmail.com', 'Tegeta Kunduchi, Dar es Salaam', 'Marine Biologist', 'University Research', 'Simon Mwakalamba', '+255674456224', '2023-05-25', '2023-05-01', 'active'),
('FCC115', 'Timothy', 'Mwakatoba', 'Honoring God', 'male', '1983-11-28', 'married', '+255663567234', 'timothy.mwakatoba@hotmail.com', 'Kigogo Mwisho, Dar es Salaam', 'Agricultural Extension Officer', 'Ministry of Agriculture', 'Ruth Mwakatoba', '+255663567235', '2019-07-07', '2019-06-15', 'active'),
('FCC116', 'Phoebe', 'Mwakalindile', 'Radiant', 'female', '1991-09-14', 'married', '+255652678245', 'phoebe.mwakalindile@yahoo.com', 'Morocco Msimbazi, Dar es Salaam', 'Speech Therapist', 'Jakaya Kikwete Hospital', 'Joseph Mwakalindile', '+255652678246', '2021-12-03', '2021-11-18', 'active'),
('FCC117', 'Titus', 'Mwakatumbila', 'Of Honor', 'male', '1986-02-17', 'married', '+255641789256', 'titus.mwakatumbila@gmail.com', 'Kimara Mwisho B, Dar es Salaam', 'Wildlife Officer', 'TANAPA', 'Mary Mwakatumbila', '+255641789257', '2020-08-20', '2020-07-30', 'active'),
('FCC118', 'Eunice', 'Mwakalanga', 'Good Victory', 'female', '1994-05-01', 'single', '+255630890267', 'eunice.mwakalanga@outlook.com', 'Buguruni Malapa, Dar es Salaam', 'Occupational Therapist', 'Muhimbili Hospital', 'Andrew Mwakalanga', '+255630890268', '2022-10-15', '2022-09-28', 'active'),
('FCC119', 'Philemon', 'Mwakabila', 'Loving', 'male', '1988-08-09', 'married', '+255619901278', 'philemon.mwakabila@hotmail.com', 'Sinza Mori C, Dar es Salaam', 'Fisheries Officer', 'Ministry of Blue Economy', 'Esther Mwakabila', '+255619901279', '2020-11-28', '2020-10-20', 'active'),
('FCC120', 'Lois', 'Mwakatombe', 'Better', 'female', '1993-01-25', 'single', '+255608012289', 'lois.mwakatombe@gmail.com', 'Mwenge Coca Cola B, Dar es Salaam', 'Tourism Officer', 'Tanzania Tourism Board', 'Daniel Mwakatombe', '+255608012290', '2022-06-10', '2022-05-22', 'active')
ON CONFLICT (member_number) DO NOTHING;

-- Add these new members to appropriate departments
-- Distribute new members across existing departments to balance membership

-- Add 5 new members to Youth Department (ages 15-35)
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Youth Department'),
  m.id,
  'member'::department_position,
  m.membership_date + INTERVAL '30 days'
FROM members m 
WHERE m.member_number IN ('FCC102', 'FCC104', 'FCC106', 'FCC110', 'FCC112')
AND NOT EXISTS (
  SELECT 1 FROM department_members dm 
  WHERE dm.member_id = m.id AND dm.department_id = (SELECT id FROM departments WHERE name = 'Youth Department')
);

-- Add 8 new female members to Women's Department
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Women''s Department'),
  m.id,
  'member'::department_position,
  m.membership_date + INTERVAL '45 days'
FROM members m 
WHERE m.gender = 'female' AND m.member_number IN ('FCC102', 'FCC104', 'FCC106', 'FCC108', 'FCC110', 'FCC112', 'FCC114', 'FCC116')
AND NOT EXISTS (
  SELECT 1 FROM department_members dm 
  WHERE dm.member_id = m.id AND dm.department_id = (SELECT id FROM departments WHERE name = 'Women''s Department')
);

-- Add 8 new male members to Men's Department
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Men''s Department'),
  m.id,
  'member'::department_position,
  m.membership_date + INTERVAL '60 days'
FROM members m 
WHERE m.gender = 'male' AND m.member_number IN ('FCC101', 'FCC103', 'FCC105', 'FCC107', 'FCC109', 'FCC111', 'FCC113', 'FCC115')
AND NOT EXISTS (
  SELECT 1 FROM department_members dm 
  WHERE dm.member_id = m.id AND dm.department_id = (SELECT id FROM departments WHERE name = 'Men''s Department')
);

-- Add 6 members to Choir & Praise Team
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Choir & Praise Team'),
  m.id,
  'member'::department_position,
  m.membership_date + INTERVAL '20 days'
FROM members m 
WHERE m.member_number IN ('FCC117', 'FCC118', 'FCC119', 'FCC120', 'FCC114', 'FCC116')
AND NOT EXISTS (
  SELECT 1 FROM department_members dm 
  WHERE dm.member_id = m.id AND dm.department_id = (SELECT id FROM departments WHERE name = 'Choir & Praise Team')
);

-- Add 4 members to Evangelism Department
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Evangelism Department'),
  m.id,
  'member'::department_position,
  m.membership_date + INTERVAL '40 days'
FROM members m 
WHERE m.member_number IN ('FCC101', 'FCC111', 'FCC113', 'FCC115')
AND NOT EXISTS (
  SELECT 1 FROM department_members dm 
  WHERE dm.member_id = m.id AND dm.department_id = (SELECT id FROM departments WHERE name = 'Evangelism Department')
);

-- Add 4 members to Ushering Department
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Ushering Department'),
  m.id,
  'member'::department_position,
  m.membership_date + INTERVAL '15 days'
FROM members m 
WHERE m.member_number IN ('FCC103', 'FCC107', 'FCC109', 'FCC117')
AND NOT EXISTS (
  SELECT 1 FROM department_members dm 
  WHERE dm.member_id = m.id AND dm.department_id = (SELECT id FROM departments WHERE name = 'Ushering Department')
);

-- Add healthcare professionals to Welfare & Counseling Department
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Welfare & Counseling Department'),
  m.id,
  'member'::department_position,
  m.membership_date + INTERVAL '55 days'
FROM members m 
WHERE m.occupation IN ('Laboratory Technician', 'Physiotherapist', 'Nutritionist', 'Speech Therapist', 'Occupational Therapist') 
  AND m.member_number IN ('FCC102', 'FCC105', 'FCC108', 'FCC116', 'FCC118')
AND NOT EXISTS (
  SELECT 1 FROM department_members dm 
  WHERE dm.member_id = m.id AND dm.department_id = (SELECT id FROM departments WHERE name = 'Welfare & Counseling Department')
);

-- Add technical members to Media & Technical Department
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Media & Technical Department'),
  m.id,
  'member'::department_position,
  m.membership_date + INTERVAL '35 days'
FROM members m 
WHERE m.occupation IN ('Electronics Technician', 'Meteorologist') 
  AND m.member_number IN ('FCC101', 'FCC112')
AND NOT EXISTS (
  SELECT 1 FROM department_members dm 
  WHERE dm.member_id = m.id AND dm.department_id = (SELECT id FROM departments WHERE name = 'Media & Technical Department')
);

-- Add environmental and research professionals to Mission & Outreach Department
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Mission & Outreach Department'),
  m.id,
  'member'::department_position,
  m.membership_date + INTERVAL '65 days'
FROM members m 
WHERE m.occupation IN ('Environmental Officer', 'Marine Biologist', 'Wildlife Officer', 'Tourism Officer', 'Fisheries Officer') 
  AND m.member_number IN ('FCC110', 'FCC114', 'FCC117', 'FCC119', 'FCC120')
AND NOT EXISTS (
  SELECT 1 FROM department_members dm 
  WHERE dm.member_id = m.id AND dm.department_id = (SELECT id FROM departments WHERE name = 'Mission & Outreach Department')
);

-- Add professionals to Prayer & Intercession Department
INSERT INTO department_members (department_id, member_id, position, joined_date) 
SELECT 
  (SELECT id FROM departments WHERE name = 'Prayer & Intercession Department'),
  m.id,
  'member'::department_position,
  m.membership_date + INTERVAL '25 days'
FROM members m 
WHERE m.member_number IN ('FCC104', 'FCC106', 'FCC108', 'FCC118')
AND NOT EXISTS (
  SELECT 1 FROM department_members dm 
  WHERE dm.member_id = m.id AND dm.department_id = (SELECT id FROM departments WHERE name = 'Prayer & Intercession Department')
);

-- Summary of what was added:
-- • 20 new members (FCC101-FCC120) with diverse professional backgrounds
-- • Balanced gender distribution (10 male, 10 female)
-- • Age range from 29-43 years old (born 1982-1996)
-- • Professional occupations including:
--   - Healthcare: Lab Tech, Physiotherapist, Nutritionist, Speech Therapist, Occupational Therapist
--   - Government: Immigration Officer, Customs Officer, Forest Officer, Agricultural Officer, Wildlife Officer
--   - Research: Meteorologist, Geologist, Marine Biologist, Environmental Officer
--   - Other: Electronics Technician, Sports Coach, Fashion Designer, Veterinary Officer, Tourism Officer
-- • Distributed across all departments while avoiding duplicates
-- • Realistic Tanzanian locations and contact information
-- • All members are active status with recent membership dates (2019-2023)

-- Run this script to safely add new members to your existing database
-- Use: psql "your-connection-string" -f database/update_members.sql