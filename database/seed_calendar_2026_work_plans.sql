-- =====================================================
-- FCC Church Calendar 2026 - Work Plans Seed Script
-- Extracted from KALENDA YA MWAKA 2026 FCC (January - June)
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Clear existing 2026 work plans to avoid duplicates
DELETE FROM work_plan_tasks WHERE work_plan_id IN (
  SELECT id FROM work_plans WHERE start_date >= '2026-01-01' AND end_date <= '2026-06-30'
);
DELETE FROM work_plans WHERE start_date >= '2026-01-01' AND end_date <= '2026-06-30';

-- =====================================================
-- 1. CHURCH-WIDE WORK PLAN: Q1 (January - March 2026)
-- =====================================================
INSERT INTO work_plans (
  title, description, scope, department_id, zone_id,
  start_date, end_date, status, budget, currency, notes,
  created_by, is_active
) VALUES (
  'Mpango wa Kazi Robo ya Kwanza 2026 (Q1)',
  'Mpango wa kazi wa Kanisa kwa Robo ya Kwanza ya mwaka 2026 - Januari hadi Machi. Unajumuisha maombi ya kitaifa, ibada za shukrani, semina, mkutano wa injili, wiki ya WWK, na tathmini ya robo mwaka.',
  'church', NULL, NULL,
  '2026-01-01', '2026-03-31',
  'active', 15000000, 'TZS',
  'Robo ya Kwanza inaanza na Maombi 21 ya Taifa na kumalizika na Tathmini ya Utendaji. Mipango mikuu: Shukrani, Maombi, Mkutano wa Injili, Wiki ya WWK.',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  true
);

-- Q1 Tasks
INSERT INTO work_plan_tasks (
  work_plan_id, title, description, priority, status,
  start_date, due_date, progress, order_index, notes,
  created_by
) VALUES
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Kwanza 2026 (Q1)' LIMIT 1),
  'Ibada ya Mwaka Mpya na Shukrani',
  'Kuandaa Ibada ya Mwaka Mpya (Jan 1) na Ibada ya Shukrani ya Mwaka (Jan 11) - programu, wahubiri wageni, muziki',
  'high', 'completed',
  '2026-01-01', '2026-01-11', 100, 1,
  'Ibada za kuanza mwaka kwa shukrani',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Kwanza 2026 (Q1)' LIMIT 1),
  'Maombi 21 ya Taifa',
  'Kuratibu siku 21 za maombi na kufunga (Jan 12 - Feb 1) - Ratiba ya kila siku, viongozi wa maombi, mada za maombi',
  'urgent', 'completed',
  '2026-01-12', '2026-02-01', 100, 2,
  'Mpango wa Kitaifa wa TAG - lazima ushirikishwe',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Kwanza 2026 (Q1)' LIMIT 1),
  'Wiki ya Wazee',
  'Kuandaa Wiki ya Baraza la Wazee (Feb 2-8) - Mafundisho, mipango ya uongozi, tathmini ya huduma',
  'high', 'completed',
  '2026-02-02', '2026-02-08', 100, 3,
  'Baraza la Wazee wanaongoza',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Kwanza 2026 (Q1)' LIMIT 1),
  'Ibada ya Ubatizo / DLD',
  'Kuandaa Ibada ya Ubatizo (Feb 15) - Darasa la Dini, maandalizi ya ubatizo, kupokewa kanisani',
  'high', 'in_progress',
  '2026-02-01', '2026-02-15', 70, 4,
  'DLD wanakamilisha maandalizi',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Kwanza 2026 (Q1)' LIMIT 1),
  'Wiki ya WWK Taifa na Semina',
  'Kuratibu Wiki ya WWK Taifa (Feb 23 - Mar 1) na Semina - Shughuli, wageni, maandalizi ya kilele',
  'high', 'in_progress',
  '2026-02-23', '2026-03-01', 40, 5,
  'Idara ya Wanawake inaongoza',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Kwanza 2026 (Q1)' LIMIT 1),
  'Mkutano wa Injili',
  'Kuandaa Mkutano wa Injili (Mar 11-15) - Uwanja, vifaa vya sauti, wahubiri, timu ya uinjilisti, ufuatiliaji',
  'urgent', 'pending',
  '2026-03-01', '2026-03-15', 20, 6,
  'Idara ya Uinjilisti inaongoza. Mahali: Uwanja wa FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Kwanza 2026 (Q1)' LIMIT 1),
  'Semina ya Mafundisho - Machi',
  'Kuandaa Semina ya Mafundisho (Mar 18-22) - Mada, wasemaji, maandalizi ya nyaraka',
  'medium', 'pending',
  '2026-03-18', '2026-03-22', 0, 7,
  'Idara ya DLD inaongoza',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Kwanza 2026 (Q1)' LIMIT 1),
  'Tathmini ya Utendaji Robo ya Kwanza',
  'Kuandaa na kuendesha Tathmini ya Utendaji Robo Mwaka (Mar 31) - Ripoti za idara, uchambuzi wa fedha, malengo',
  'urgent', 'pending',
  '2026-03-25', '2026-03-31', 0, 8,
  'Idara ZOTE zinatakiwa kuwasilisha ripoti',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Kwanza 2026 (Q1)' LIMIT 1),
  'Mkesha na Matendo ya Ukarimu (Kila Mwezi)',
  'Kuratibu Mkesha wa kila mwezi (Jan 30, Feb 20, Mar 28) na Matendo ya Ukarimu (Jan 31, Feb 28, Mar 30)',
  'medium', 'in_progress',
  '2026-01-01', '2026-03-31', 33, 9,
  'Maombi na Huduma ya jamii kila mwezi',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
);

-- =====================================================
-- 2. CHURCH-WIDE WORK PLAN: Q2 (April - June 2026)
-- =====================================================
INSERT INTO work_plans (
  title, description, scope, department_id, zone_id,
  start_date, end_date, status, budget, currency, notes,
  created_by, is_active
) VALUES (
  'Mpango wa Kazi Robo ya Pili 2026 (Q2)',
  'Mpango wa kazi wa Kanisa kwa Robo ya Pili ya mwaka 2026 - Aprili hadi Juni. Unajumuisha Pasaka, Wiki ya CA''s, CMF, Pentekoste, Makambi ya Uamsho, Wiki ya CMS, na Tathmini ya Nusu Mwaka.',
  'church', NULL, NULL,
  '2026-04-01', '2026-06-30',
  'active', 20000000, 'TZS',
  'Robo ya Pili ina matukio makubwa: Pasaka, Wiki ya CA''s, CMF Taifa, Pentekoste/Makambi ya Uamsho, CMS. Kumalizika na Tathmini ya Nusu Mwaka.',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  true
);

-- Q2 Tasks
INSERT INTO work_plan_tasks (
  work_plan_id, title, description, priority, status,
  start_date, due_date, progress, order_index, notes,
  created_by
) VALUES
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Pili 2026 (Q2)' LIMIT 1),
  'Semina na Ibada ya Pasaka',
  'Kuandaa Semina ya Pasaka (Apr 16-20), Ijumaa Kuu (Apr 18), na Ibada ya Pasaka (Apr 20) - Programu, Meza ya Bwana',
  'urgent', 'pending',
  '2026-04-10', '2026-04-20', 0, 1,
  'Juma la Pasaka ni tukio muhimu la robo hii',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Pili 2026 (Q2)' LIMIT 1),
  'Wiki ya CA''s (Vijana) - Apr-Jun',
  'Kuratibu programu ya Wiki ya CA''s (Apr 1 - Jun 1) - Mipango ya vijana, semina, mkutano wa injili, mkesha',
  'high', 'pending',
  '2026-04-01', '2026-06-01', 0, 2,
  'Programu ndefu - Idara ya Vijana inaongoza',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Pili 2026 (Q2)' LIMIT 1),
  'Wiki ya CMF Taifa na Semina',
  'Kuratibu Wiki ya CMF Taifa (Apr 28 - May 4), Semina (May 1-4), na Kilele (May 4) - Shughuli za wanaume',
  'high', 'pending',
  '2026-04-28', '2026-05-04', 0, 3,
  'Idara ya Wanaume inaongoza',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Pili 2026 (Q2)' LIMIT 1),
  'Mkutano wa Injili CA''s Section',
  'Kuandaa Mkutano wa Injili wa CA''s ngazi ya Section (May 9-10) - Uwanja, wahubiri vijana, timu',
  'high', 'pending',
  '2026-05-01', '2026-05-10', 0, 4,
  'CA''s Section wanaongoza',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Pili 2026 (Q2)' LIMIT 1),
  'Wiki ya Pentekoste na Makambi ya Uamsho',
  'Kuratibu Wiki ya Pentekoste Taifa (May 13-19) na Makambi ya Uamsho (Jun 2-8) - Programu kuu ya robo hii',
  'urgent', 'pending',
  '2026-05-13', '2026-06-08', 0, 5,
  'Miaka 13 ya Moto wa Uamsho - tukio kubwa!',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Pili 2026 (Q2)' LIMIT 1),
  'Wiki ya CMS na Kilele',
  'Kuratibu Wiki ya CMS (Jun 9-15), Semina (Jun 13-15), na Kilele/Kuweka Wakfu (Jun 15)',
  'high', 'pending',
  '2026-06-09', '2026-06-15', 0, 6,
  'Idara ya Watoto inaongoza',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Pili 2026 (Q2)' LIMIT 1),
  'Semina ya Wanandoa na Maombi',
  'Kuandaa Semina ya Wanandoa (Jun 22) na Semina ya Maombi (Jun 25-29)',
  'medium', 'pending',
  '2026-06-20', '2026-06-29', 0, 7,
  'Huduma ya Kijamii na Maombi',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Pili 2026 (Q2)' LIMIT 1),
  'Tathmini ya Utendaji na Ripoti za Nusu Mwaka',
  'Kuandaa na kuendesha Tathmini ya Nusu Mwaka (Jun 30) - Ripoti kamili za idara zote, fedha, na mipango ya H2',
  'urgent', 'pending',
  '2026-06-25', '2026-06-30', 0, 8,
  'Tathmini ya NUSU MWAKA - Ripoti kamili zinahitajika',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Robo ya Pili 2026 (Q2)' LIMIT 1),
  'Mkesha, Sadaka ya Umisheni, Matendo ya Ukarimu (Kila Mwezi)',
  'Kuratibu shughuli za kila mwezi: Mkesha, Sadaka ya Umisheni, Meza ya Bwana, Kuombea Watoto, Matendo ya Ukarimu',
  'medium', 'pending',
  '2026-04-01', '2026-06-30', 0, 9,
  'Shughuli za kila mwezi zinaendelea',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
);

-- =====================================================
-- 3. DEPARTMENT WORK PLAN: WWK (Women's Department)
-- =====================================================
INSERT INTO work_plans (
  title, description, scope, department_id, zone_id,
  start_date, end_date, status, budget, currency, notes,
  created_by, is_active
) VALUES (
  'Mpango wa Kazi WWK - Nusu Mwaka 2026',
  'Mpango wa Kazi wa Idara ya Wanawake (WWK) kwa Nusu ya Kwanza ya 2026. Wiki ya WWK Taifa, Semina, Kilele, Semina ya Mabinti, Mkutano Mkuu WWK Dodoma.',
  'department',
  (SELECT id FROM departments WHERE name = 'Women''s Department' LIMIT 1),
  NULL,
  '2026-01-01', '2026-06-30',
  'active', 5000000, 'TZS',
  'WWK wana matukio mawili makubwa: Wiki ya WWK Taifa (Feb-Mar) na Mkutano Mkuu Dodoma (Jun)',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  true
);

INSERT INTO work_plan_tasks (
  work_plan_id, title, description, priority, status,
  start_date, due_date, progress, order_index, notes, created_by
) VALUES
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi WWK - Nusu Mwaka 2026' LIMIT 1),
  'Maandalizi ya Wiki ya WWK Taifa',
  'Kuandaa Wiki ya WWK (Feb 23 - Mar 1) - Ratiba, wageni, semina, maandalizi ya kilele',
  'urgent', 'in_progress',
  '2026-01-15', '2026-02-22', 60, 1,
  'Wiki inaanza Feb 23',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi WWK - Nusu Mwaka 2026' LIMIT 1),
  'Semina ya Mabinti',
  'Kuandaa Semina ya Mabinti (Apr 21) - Mada, wasemaji, maandalizi',
  'medium', 'pending',
  '2026-04-01', '2026-04-21', 0, 2,
  'Semina maalum kwa mabinti',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi WWK - Nusu Mwaka 2026' LIMIT 1),
  'Maandalizi ya Mkutano Mkuu WWK Dodoma',
  'Kuratibu safari na ushiriki katika Mkutano Mkuu WWK Taifa Dodoma (Jun 19+) - Usafiri, malazi, michango',
  'high', 'pending',
  '2026-05-01', '2026-06-19', 0, 3,
  'Mkutano Mkuu wa Kitaifa Dodoma',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
);

-- =====================================================
-- 4. DEPARTMENT WORK PLAN: CMF (Men's Department)
-- =====================================================
INSERT INTO work_plans (
  title, description, scope, department_id, zone_id,
  start_date, end_date, status, budget, currency, notes,
  created_by, is_active
) VALUES (
  'Mpango wa Kazi CMF - Nusu Mwaka 2026',
  'Mpango wa Kazi wa Idara ya Wanaume (CMF) kwa Nusu ya Kwanza ya 2026. Wiki ya CMF Taifa, Semina, Kilele.',
  'department',
  (SELECT id FROM departments WHERE name = 'Men''s Department' LIMIT 1),
  NULL,
  '2026-01-01', '2026-06-30',
  'active', 4000000, 'TZS',
  'CMF wana Wiki ya CMF Taifa (Apr 28 - May 4) kama tukio kuu',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  true
);

INSERT INTO work_plan_tasks (
  work_plan_id, title, description, priority, status,
  start_date, due_date, progress, order_index, notes, created_by
) VALUES
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi CMF - Nusu Mwaka 2026' LIMIT 1),
  'Maandalizi ya Wiki ya CMF Taifa',
  'Kuandaa Wiki ya CMF Taifa (Apr 28 - May 4) - Ratiba, wageni, semina, maandalizi ya kilele',
  'urgent', 'pending',
  '2026-03-15', '2026-04-27', 0, 1,
  'Tukio kuu la CMF mwaka huu',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi CMF - Nusu Mwaka 2026' LIMIT 1),
  'Semina ya CMF (May 1-4)',
  'Kuandaa Semina maalum ndani ya Wiki ya CMF - Mada, wasemaji, nyaraka',
  'high', 'pending',
  '2026-04-15', '2026-05-04', 0, 2,
  'Semina ni sehemu ya Wiki ya CMF',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi CMF - Nusu Mwaka 2026' LIMIT 1),
  'Kilele ya CMF (May 4)',
  'Kuandaa Ibada ya Kilele ya Wiki ya CMF - Programu, muziki, wahubiri',
  'high', 'pending',
  '2026-04-28', '2026-05-04', 0, 3,
  'Siku ya mwisho ya Wiki ya CMF',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
);

-- =====================================================
-- 5. DEPARTMENT WORK PLAN: CA's (Youth Department)
-- =====================================================
INSERT INTO work_plans (
  title, description, scope, department_id, zone_id,
  start_date, end_date, status, budget, currency, notes,
  created_by, is_active
) VALUES (
  'Mpango wa Kazi CA''s - Nusu Mwaka 2026',
  'Mpango wa Kazi wa Idara ya Vijana (CA''s / Christ''s Ambassadors) kwa Nusu ya Kwanza ya 2026. Wiki ya CA''s, Mkutano wa Injili, Mkesha wa Vijana.',
  'department',
  (SELECT id FROM departments WHERE name = 'Youth Department' LIMIT 1),
  NULL,
  '2026-01-01', '2026-06-30',
  'active', 6000000, 'TZS',
  'CA''s wana Wiki ndefu (Apr-Jun), Mkutano wa Injili, na Mkesha maalum',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  true
);

INSERT INTO work_plan_tasks (
  work_plan_id, title, description, priority, status,
  start_date, due_date, progress, order_index, notes, created_by
) VALUES
(
  (SELECT id FROM work_plans WHERE title LIKE 'Mpango wa Kazi CA%Nusu Mwaka 2026' LIMIT 1),
  'Wiki ya CA''s - Programu Kamili',
  'Kuratibu Wiki nzima ya CA''s (Apr 1 - Jun 1) - Mpango wa shughuli za kila wiki, semina, huduma',
  'urgent', 'pending',
  '2026-03-15', '2026-06-01', 0, 1,
  'Wiki ndefu ya miezi miwili',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title LIKE 'Mpango wa Kazi CA%Nusu Mwaka 2026' LIMIT 1),
  'Mkutano wa Injili CA''s Section (May 9-10)',
  'Kuandaa Mkutano wa Injili wa vijana ngazi ya Section - Uwanja, wahubiri, timu ya uinjilisti',
  'high', 'pending',
  '2026-04-15', '2026-05-10', 0, 2,
  'Uinjilisti wa vijana Section',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title LIKE 'Mpango wa Kazi CA%Nusu Mwaka 2026' LIMIT 1),
  'Mkesha wa CA''s (May 23)',
  'Kuandaa Mkesha maalum wa Vijana - Programu ya usiku, muziki, wahubiri vijana',
  'medium', 'pending',
  '2026-05-15', '2026-05-23', 0, 3,
  'Mkesha maalum wa vijana',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
);

-- =====================================================
-- 6. DEPARTMENT WORK PLAN: CMS (Children's Department)
-- =====================================================
INSERT INTO work_plans (
  title, description, scope, department_id, zone_id,
  start_date, end_date, status, budget, currency, notes,
  created_by, is_active
) VALUES (
  'Mpango wa Kazi CMS - Nusu Mwaka 2026',
  'Mpango wa Kazi wa Idara ya Watoto (CMS / Children''s Ministry) kwa Nusu ya Kwanza ya 2026. Wiki ya CMS, Semina, Kilele, Kuombea Watoto kila mwezi.',
  'department',
  (SELECT id FROM departments WHERE name = 'Children''s Department' LIMIT 1),
  NULL,
  '2026-01-01', '2026-06-30',
  'active', 3000000, 'TZS',
  'CMS wana Wiki ya CMS (Jun 9-15) na Kuombea Watoto kila mwezi',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  true
);

INSERT INTO work_plan_tasks (
  work_plan_id, title, description, priority, status,
  start_date, due_date, progress, order_index, notes, created_by
) VALUES
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi CMS - Nusu Mwaka 2026' LIMIT 1),
  'Kuombea Watoto - Kila Mwezi',
  'Kuratibu ibada ya Kuombea Watoto kila mwezi (Jan 4, Feb 8, Mar 30, Apr 27, May 18, Jun 15)',
  'high', 'in_progress',
  '2026-01-01', '2026-06-30', 33, 1,
  'Kuombea watoto kila mwezi - hatua muhimu',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi CMS - Nusu Mwaka 2026' LIMIT 1),
  'Maandalizi ya Wiki ya CMS (Jun 9-15)',
  'Kuandaa Wiki ya CMS - Programu za watoto, Semina ya walimu (Jun 13-15), Kilele (Jun 15)',
  'urgent', 'pending',
  '2026-05-01', '2026-06-15', 0, 2,
  'Tukio kuu la CMS mwaka huu',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi CMS - Nusu Mwaka 2026' LIMIT 1),
  'Kuweka Wakfu Watoto (Jun 15)',
  'Kuandaa ibada maalum ya Kuweka Wakfu Watoto - Familia, maandalizi, programu',
  'high', 'pending',
  '2026-06-01', '2026-06-15', 0, 3,
  'Ibada maalum siku ya Kilele ya CMS',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
);

-- =====================================================
-- 7. DEPARTMENT WORK PLAN: Evangelism
-- =====================================================
INSERT INTO work_plans (
  title, description, scope, department_id, zone_id,
  start_date, end_date, status, budget, currency, notes,
  created_by, is_active
) VALUES (
  'Mpango wa Kazi Uinjilisti - Nusu Mwaka 2026',
  'Mpango wa Kazi wa Idara ya Uinjilisti kwa Nusu ya Kwanza ya 2026. Mkutano wa Injili, Makambi ya Uamsho, ushirikiano na CA''s.',
  'department',
  (SELECT id FROM departments WHERE name = 'Evangelism Department' LIMIT 1),
  NULL,
  '2026-01-01', '2026-06-30',
  'active', 8000000, 'TZS',
  'Mikutano ya Injili na Makambi ya Uamsho - Miaka 13 ya Moto wa Uamsho',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  true
);

INSERT INTO work_plan_tasks (
  work_plan_id, title, description, priority, status,
  start_date, due_date, progress, order_index, notes, created_by
) VALUES
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Uinjilisti - Nusu Mwaka 2026' LIMIT 1),
  'Mkutano wa Injili - Machi',
  'Kuandaa Mkutano wa Injili (Mar 11-15) - Uwanja, vifaa, wahubiri, ufuatiliaji wa waliookoka',
  'urgent', 'pending',
  '2026-02-01', '2026-03-15', 20, 1,
  'Mkutano mkubwa wa Q1',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Uinjilisti - Nusu Mwaka 2026' LIMIT 1),
  'Makambi ya Uamsho (Jun 2-8)',
  'Kuandaa Makambi ya Uamsho - Wiki ya Pentekoste na uamsho mkubwa. Miaka 13 ya Moto wa Uamsho!',
  'urgent', 'pending',
  '2026-04-01', '2026-06-08', 0, 2,
  'Tukio kubwa kabisa la nusu mwaka',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Uinjilisti - Nusu Mwaka 2026' LIMIT 1),
  'Ufuatiliaji wa Waliookoka',
  'Kuandaa mpango wa ufuatiliaji wa wote waliookoka katika mikutano ya injili - Darasa la DLD, jumuiya',
  'high', 'pending',
  '2026-03-16', '2026-06-30', 0, 3,
  'Kuhakikisha waliookoka wanafuatiliwa na kuingizwa kanisani',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
);

-- =====================================================
-- 8. DEPARTMENT WORK PLAN: Prayer & Intercession
-- =====================================================
INSERT INTO work_plans (
  title, description, scope, department_id, zone_id,
  start_date, end_date, status, budget, currency, notes,
  created_by, is_active
) VALUES (
  'Mpango wa Kazi Maombi - Nusu Mwaka 2026',
  'Mpango wa Kazi wa Idara ya Maombi na Maombezi kwa Nusu ya Kwanza ya 2026. Maombi 21 ya Taifa, Mkesha wa kila mwezi, Kongamano Maombi ya Uamsho, Wiki ya Maombi.',
  'department',
  (SELECT id FROM departments WHERE name = 'Prayer & Intercession Department' LIMIT 1),
  NULL,
  '2026-01-01', '2026-06-30',
  'active', 2000000, 'TZS',
  'Maombi ni msingi wa kila kitu - Maombi 21, Mkesha, Kongamano, Semina ya Maombi',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  true
);

INSERT INTO work_plan_tasks (
  work_plan_id, title, description, priority, status,
  start_date, due_date, progress, order_index, notes, created_by
) VALUES
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Maombi - Nusu Mwaka 2026' LIMIT 1),
  'Maombi 21 ya Taifa (Jan 12 - Feb 1)',
  'Kuratibu siku 21 za maombi - Ratiba, viongozi, mada, mahali',
  'urgent', 'completed',
  '2026-01-12', '2026-02-01', 100, 1,
  'Mpango wa Kitaifa - umekamilika',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Maombi - Nusu Mwaka 2026' LIMIT 1),
  'Mkesha wa Kila Mwezi',
  'Kuratibu Mkesha wa kila mwezi (Jan, Feb, Mar, Apr, May, Jun) - Programu, viongozi, mada',
  'high', 'in_progress',
  '2026-01-01', '2026-06-30', 33, 2,
  'Mkesha unaendelea kila mwezi',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Maombi - Nusu Mwaka 2026' LIMIT 1),
  'Kongamano Maombi ya Uamsho Section (Apr 25-26)',
  'Kuandaa Kongamano la Maombi ya Uamsho ngazi ya Section',
  'high', 'pending',
  '2026-04-01', '2026-04-26', 0, 3,
  'Kongamano la Section - siku mbili',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
),
(
  (SELECT id FROM work_plans WHERE title = 'Mpango wa Kazi Maombi - Nusu Mwaka 2026' LIMIT 1),
  'Semina ya Maombi (Jun 25-29)',
  'Kuandaa Semina ya Maombi - Mafundisho ya kina kuhusu maombi, vita vya rohoni',
  'high', 'pending',
  '2026-06-01', '2026-06-29', 0, 4,
  'Semina ya mwisho wa nusu mwaka',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1)
);

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Work Plans Created:' as info, COUNT(*) as count FROM work_plans 
WHERE start_date >= '2026-01-01' AND is_active = true;

SELECT wp.title, wp.scope, wp.status, 
  (SELECT COUNT(*) FROM work_plan_tasks wpt WHERE wpt.work_plan_id = wp.id) as task_count
FROM work_plans wp 
WHERE wp.start_date >= '2026-01-01' AND wp.is_active = true
ORDER BY wp.start_date;
