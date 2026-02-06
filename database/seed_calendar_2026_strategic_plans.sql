-- =====================================================
-- FCC Church Calendar 2026 - Strategic Plans Seed Script
-- Extracted from KALENDA YA MWAKA 2026 FCC (January - June)
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Clear existing 2026 strategic plans to avoid duplicates
DELETE FROM strategic_objectives WHERE strategic_goal_id IN (
  SELECT sg.id FROM strategic_goals sg 
  INNER JOIN strategic_plans sp ON sg.strategic_plan_id = sp.id 
  WHERE sp.year_start = 2026
);
DELETE FROM strategic_goals WHERE strategic_plan_id IN (
  SELECT id FROM strategic_plans WHERE year_start = 2026
);
DELETE FROM strategic_plans WHERE year_start = 2026;

-- =====================================================
-- 1. MAIN CHURCH STRATEGIC PLAN: FCC Vision 2026
-- =====================================================
INSERT INTO strategic_plans (
  title, vision, mission, description, scope,
  department_id, zone_id, year_start, year_end,
  status, created_by, is_active
) VALUES (
  'Mpango Mkakati wa FCC 2026 - Miaka 13 ya Moto wa Uamsho',
  'Kuwa Kanisa lenye nguvu ya Roho Mtakatifu, linalokua kwa idadi na ubora wa imani, linalofika jamii kwa Injili na huduma za huruma - Miaka 13 ya Moto wa Uamsho',
  'Kuhubiri Injili, kujenga wanafunzi, kutumikia jamii kwa upendo wa Kristo, na kueneza moto wa uamsho kupitia TAG Tanzania',
  'Mpango Mkakati wa Filadefia Christian Center (FCC) kwa mwaka 2026. Mpango huu unatokana na Kalenda ya Kanisa na unajumuisha malengo ya kiroho, ukuaji wa kanisa, huduma za idara, na maendeleo ya jamii. Mwaka huu ni sehemu ya Miaka 13 ya Moto wa Uamsho.',
  'church', NULL, NULL,
  2026, 2026,
  'active',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  true
);

-- =====================================================
-- GOAL 1: Ukuaji wa Kiroho (Spiritual Growth)
-- =====================================================
INSERT INTO strategic_goals (
  strategic_plan_id, title, description,
  target_metric, target_value, current_value,
  priority, status, progress, order_index
) VALUES (
  (SELECT id FROM strategic_plans WHERE title LIKE 'Mpango Mkakati wa FCC 2026%' AND scope = 'church' LIMIT 1),
  'Ukuaji wa Kiroho na Mafundisho',
  'Kuimarisha ukuaji wa kiroho wa washirika kupitia mafundisho, semina, na programu za ufunzaji. Kuhakikisha kila mshirika anapata msingi imara wa Neno la Mungu.',
  'Idadi ya Semina zilizofanyika', '12', '2',
  'high', 'in_progress', 20, 1
);

INSERT INTO strategic_objectives (
  strategic_goal_id, title, description, key_result,
  due_date, status, progress, order_index
) VALUES
(
  (SELECT id FROM strategic_goals WHERE title = 'Ukuaji wa Kiroho na Mafundisho' LIMIT 1),
  'Semina ya Roho Mtakatifu - Section',
  'Kuendesha Semina kuhusu Roho Mtakatifu ngazi ya Section (Mar 8) - Kuimarisha ufahamu wa kazi ya Roho Mtakatifu',
  'Semina imefanyika na washiriki 200+',
  '2026-03-08', 'pending', 0, 1
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Ukuaji wa Kiroho na Mafundisho' LIMIT 1),
  'Semina ya Mafundisho - Machi',
  'Kuendesha Semina ya Mafundisho ya Neno (Mar 18-22) - Mafundisho ya kina ya Biblia',
  'Semina ya siku 5 imefanyika',
  '2026-03-22', 'pending', 0, 2
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Ukuaji wa Kiroho na Mafundisho' LIMIT 1),
  'Semina ya Pasaka',
  'Kuendesha Semina ya Pasaka (Apr 16-20) - Mafundisho ya mateso, kifo, na ufufuo wa Kristo',
  'Ibada za Pasaka zimefanyika kwa ufanisi',
  '2026-04-20', 'pending', 0, 3
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Ukuaji wa Kiroho na Mafundisho' LIMIT 1),
  'Semina ya Pentekoste',
  'Kuendesha Semina ya Pentekoste (May 15-19) - Karama za Roho Mtakatifu na maisha ya Kipentekoste',
  'Washirika wamejengwa katika karama za Roho',
  '2026-05-19', 'pending', 0, 4
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Ukuaji wa Kiroho na Mafundisho' LIMIT 1),
  'Darasa la Dini (DLD) na Ubatizo',
  'Kuendesha DLD na Ibada ya Ubatizo (Feb 15) - Kuandaa waumini wapya kupokewa kanisani',
  'Wanafunzi 30+ wamebatizwa',
  '2026-02-15', 'in_progress', 60, 5
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Ukuaji wa Kiroho na Mafundisho' LIMIT 1),
  'Semina ya Wanandoa',
  'Kuendesha Semina ya Wanandoa (Jun 22) - Kuimarisha ndoa na familia za washirika',
  'Wanandoa 50+ wameshiriki',
  '2026-06-22', 'pending', 0, 6
);

-- =====================================================
-- GOAL 2: Maombi na Uamsho (Prayer & Revival)
-- =====================================================
INSERT INTO strategic_goals (
  strategic_plan_id, title, description,
  target_metric, target_value, current_value,
  priority, status, progress, order_index
) VALUES (
  (SELECT id FROM strategic_plans WHERE title LIKE 'Mpango Mkakati wa FCC 2026%' AND scope = 'church' LIMIT 1),
  'Maombi na Uamsho - Miaka 13 ya Moto',
  'Kuendeleza na kuimarisha maombi ya kanisa kama msingi wa uamsho. Maombi 21 ya Taifa, Mkesha wa kila mwezi, Kongamano ya Maombi, na Makambi ya Uamsho.',
  'Washiriki wa Mkesha wastani', '200', '150',
  'urgent', 'in_progress', 30, 2
);

INSERT INTO strategic_objectives (
  strategic_goal_id, title, description, key_result,
  due_date, status, progress, order_index
) VALUES
(
  (SELECT id FROM strategic_goals WHERE title = 'Maombi na Uamsho - Miaka 13 ya Moto' LIMIT 1),
  'Maombi 21 ya Taifa',
  'Kushiriki kikamilifu katika Maombi 21 ya Taifa ya TAG (Jan 12 - Feb 1) - Washirika wote wanashiriki',
  'Siku 21 za maombi zimekamilika na ushiriki wa 80%+ washirika',
  '2026-02-01', 'completed', 100, 1
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Maombi na Uamsho - Miaka 13 ya Moto' LIMIT 1),
  'Mkesha wa Kila Mwezi',
  'Kuendesha Mkesha kila mwezi (Jan-Jun) - Kuongeza ushiriki na ubora wa maombi',
  'Mkesha 6 umefanyika kwa wastani wa washiriki 200',
  '2026-06-30', 'in_progress', 33, 2
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Maombi na Uamsho - Miaka 13 ya Moto' LIMIT 1),
  'Kongamano Maombi ya Uamsho Section',
  'Kuendesha Kongamano la Maombi ya Uamsho ngazi ya Section (Apr 25-26) - Kuamsha moto wa uamsho',
  'Kongamano limefanyika, makanisa 10+ yameshiriki',
  '2026-04-26', 'pending', 0, 3
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Maombi na Uamsho - Miaka 13 ya Moto' LIMIT 1),
  'Makambi ya Uamsho / Pentekoste',
  'Kuendesha Makambi ya Uamsho (Jun 2-8) - Tukio kuu la uamsho la mwaka - Miaka 13 ya Moto wa Uamsho',
  'Makambi ya Uamsho yenye washiriki 500+ na nafsi 100+ ziliookoka',
  '2026-06-08', 'pending', 0, 4
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Maombi na Uamsho - Miaka 13 ya Moto' LIMIT 1),
  'Semina ya Maombi',
  'Kuendesha Semina ya Maombi (Jun 25-29) - Kujenga uwezo wa maombi wa washirika',
  'Washiriki 150+ wamejengwa katika maombi',
  '2026-06-29', 'pending', 0, 5
);

-- =====================================================
-- GOAL 3: Uinjilisti na Kufikia (Evangelism & Outreach)
-- =====================================================
INSERT INTO strategic_goals (
  strategic_plan_id, title, description,
  target_metric, target_value, current_value,
  priority, status, progress, order_index
) VALUES (
  (SELECT id FROM strategic_plans WHERE title LIKE 'Mpango Mkakati wa FCC 2026%' AND scope = 'church' LIMIT 1),
  'Uinjilisti na Kufikia Jamii',
  'Kufika jamii kwa Injili kupitia mikutano ya injili, matendo ya ukarimu, na ushirikiano wa idara. Lengo: Nafsi 500+ ziokoke katika nusu mwaka.',
  'Nafsi ziliookoka', '500', '0',
  'urgent', 'in_progress', 10, 3
);

INSERT INTO strategic_objectives (
  strategic_goal_id, title, description, key_result,
  due_date, status, progress, order_index
) VALUES
(
  (SELECT id FROM strategic_goals WHERE title = 'Uinjilisti na Kufikia Jamii' LIMIT 1),
  'Mkutano wa Injili - Machi',
  'Kuendesha Mkutano wa Injili (Mar 11-15) - Siku 5 za kuhubiri Injili kwa nguvu',
  'Nafsi 200+ zimekubali wokovu na zinafuatiliwa',
  '2026-03-15', 'pending', 0, 1
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Uinjilisti na Kufikia Jamii' LIMIT 1),
  'Mkutano wa Injili CA''s Section',
  'Kuendesha Mkutano wa Injili wa vijana Section (May 9-10) - Vijana wanainjilisha',
  'Nafsi 100+ zimekubali wokovu katika mkutano wa vijana',
  '2026-05-10', 'pending', 0, 2
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Uinjilisti na Kufikia Jamii' LIMIT 1),
  'Matendo ya Ukarimu - Kila Mwezi',
  'Kuendesha Matendo ya Ukarimu kila mwezi (Jan-Jun) - Huduma ya jamii na ushahidi',
  'Matendo ya Ukarimu 6 yenye familia 50+ zimesaidiwa kila mwezi',
  '2026-06-30', 'in_progress', 33, 3
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Uinjilisti na Kufikia Jamii' LIMIT 1),
  'Sadaka ya Umisheni - Kila Mwezi',
  'Kukusanya Sadaka ya Umisheni kila mwezi - Kusaidia kazi ya misioni ndani na nje',
  'Sadaka ya Umisheni imeongezeka 20% kuliko mwaka jana',
  '2026-06-30', 'in_progress', 17, 4
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Uinjilisti na Kufikia Jamii' LIMIT 1),
  'Ufuatiliaji wa Waliookoka',
  'Kuandaa mpango wa ufuatiliaji wa wote waliookoka - DLD, jumuiya, mentorship',
  '80% ya waliookoka wameingia DLD na jumuiya',
  '2026-06-30', 'pending', 0, 5
);

-- =====================================================
-- GOAL 4: Maendeleo ya Idara (Department Development)
-- =====================================================
INSERT INTO strategic_goals (
  strategic_plan_id, title, description,
  target_metric, target_value, current_value,
  priority, status, progress, order_index
) VALUES (
  (SELECT id FROM strategic_plans WHERE title LIKE 'Mpango Mkakati wa FCC 2026%' AND scope = 'church' LIMIT 1),
  'Maendeleo ya Idara na Uongozi',
  'Kuimarisha idara zote za kanisa kupitia wiki maalum za idara, semina za viongozi, na tathmini ya utendaji. Kila idara inapata wiki yake ya kujiendeleza.',
  'Idadi ya Wiki za Idara zilizofanyika', '5', '0',
  'high', 'in_progress', 10, 4
);

INSERT INTO strategic_objectives (
  strategic_goal_id, title, description, key_result,
  due_date, status, progress, order_index
) VALUES
(
  (SELECT id FROM strategic_goals WHERE title = 'Maendeleo ya Idara na Uongozi' LIMIT 1),
  'Wiki ya Wazee (Feb 2-8)',
  'Kuendesha Wiki ya Baraza la Wazee - Kujenga uongozi wa kanisa',
  'Wazee wote wameshiriki na mipango ya mwaka imewekwa',
  '2026-02-08', 'completed', 100, 1
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Maendeleo ya Idara na Uongozi' LIMIT 1),
  'Wiki ya WWK Taifa (Feb 23 - Mar 1)',
  'Kuendesha Wiki ya WWK - Semina, mafundisho, na kilele ya wanawake',
  'Wiki ya WWK imefanyika kwa mafanikio',
  '2026-03-01', 'in_progress', 40, 2
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Maendeleo ya Idara na Uongozi' LIMIT 1),
  'Wiki ya CA''s (Apr 1 - Jun 1)',
  'Kuendesha Wiki ndefu ya CA''s - Programu za vijana, uinjilisti, mkesha',
  'Vijana 200+ wameshiriki katika programu za wiki ya CA''s',
  '2026-06-01', 'pending', 0, 3
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Maendeleo ya Idara na Uongozi' LIMIT 1),
  'Wiki ya CMF Taifa (Apr 28 - May 4)',
  'Kuendesha Wiki ya CMF - Semina, mafundisho, na kilele ya wanaume',
  'Wanaume 150+ wameshiriki na wamejengwa',
  '2026-05-04', 'pending', 0, 4
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Maendeleo ya Idara na Uongozi' LIMIT 1),
  'Wiki ya CMS (Jun 9-15)',
  'Kuendesha Wiki ya CMS - Programu za watoto, semina ya walimu, kilele, kuweka wakfu',
  'Watoto 100+ na walimu 30+ wameshiriki',
  '2026-06-15', 'pending', 0, 5
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Maendeleo ya Idara na Uongozi' LIMIT 1),
  'Semina Viongozi Section (Apr 12)',
  'Kuendesha Semina ya Viongozi ngazi ya Section - Kujenga uwezo wa uongozi',
  'Viongozi 50+ wameshiriki na wamejengwa',
  '2026-04-12', 'pending', 0, 6
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Maendeleo ya Idara na Uongozi' LIMIT 1),
  'Kongamano Viongozi Jimbo (Feb 14)',
  'Kushiriki katika Kongamano la Viongozi wa Jimbo',
  'Viongozi wa FCC wameshiriki na wamerejea na mipango',
  '2026-02-14', 'in_progress', 80, 7
);

-- =====================================================
-- GOAL 5: Tathmini na Uwajibikaji (Evaluation & Accountability)
-- =====================================================
INSERT INTO strategic_goals (
  strategic_plan_id, title, description,
  target_metric, target_value, current_value,
  priority, status, progress, order_index
) VALUES (
  (SELECT id FROM strategic_plans WHERE title LIKE 'Mpango Mkakati wa FCC 2026%' AND scope = 'church' LIMIT 1),
  'Tathmini na Uwajibikaji',
  'Kuhakikisha uwajibikaji na tathmini ya utendaji wa kila robo mwaka. Kila idara inawasilisha ripoti na kufanya tathmini ya malengo yake.',
  'Tathmini zilizofanyika', '2', '0',
  'high', 'in_progress', 0, 5
);

INSERT INTO strategic_objectives (
  strategic_goal_id, title, description, key_result,
  due_date, status, progress, order_index
) VALUES
(
  (SELECT id FROM strategic_goals WHERE title = 'Tathmini na Uwajibikaji' LIMIT 1),
  'Tathmini ya Robo ya Kwanza (Mar 31)',
  'Kuendesha Tathmini ya Utendaji Robo ya Kwanza - Ripoti za idara zote, uchambuzi wa fedha',
  'Idara zote zimewasilisha ripoti na tathmini imefanyika',
  '2026-03-31', 'pending', 0, 1
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Tathmini na Uwajibikaji' LIMIT 1),
  'Tathmini ya Nusu Mwaka (Jun 30)',
  'Kuendesha Tathmini ya Utendaji na Ripoti za Nusu Mwaka - Ripoti kamili, mipango ya H2',
  'Tathmini kamili ya nusu mwaka imefanyika na mipango ya H2 imewekwa',
  '2026-06-30', 'pending', 0, 2
),
(
  (SELECT id FROM strategic_goals WHERE title = 'Tathmini na Uwajibikaji' LIMIT 1),
  'Ripoti za Fedha za Kila Robo',
  'Kuandaa ripoti kamili za fedha kwa kila robo mwaka - Mapato, matumizi, bajeti',
  'Ripoti 2 za fedha zimewekwa na kuidhinishwa',
  '2026-06-30', 'pending', 0, 3
);

-- =====================================================
-- 2. DEPARTMENT STRATEGIC PLAN: Evangelism
-- =====================================================
INSERT INTO strategic_plans (
  title, vision, mission, description, scope,
  department_id, zone_id, year_start, year_end,
  status, created_by, is_active
) VALUES (
  'Mkakati wa Uinjilisti 2026',
  'Kufika kila kijiji na mtaa kwa Injili ya Yesu Kristo - Hakuna atakayeachwa bila kusikia Neno',
  'Kuhubiri Injili kwa kila mtu, kupitia mikutano ya injili, huduma ya jamii, na ushahidi wa kila siku',
  'Mpango Mkakati wa Idara ya Uinjilisti kwa 2026. Mkutano wa Injili, Makambi ya Uamsho, na ushirikiano na idara nyingine kwa lengo la nafsi 500+ kuokoka.',
  'department',
  (SELECT id FROM departments WHERE name = 'Evangelism Department' LIMIT 1),
  NULL, 2026, 2026,
  'active',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  true
);

INSERT INTO strategic_goals (
  strategic_plan_id, title, description,
  target_metric, target_value, current_value,
  priority, status, progress, order_index
) VALUES
(
  (SELECT id FROM strategic_plans WHERE title = 'Mkakati wa Uinjilisti 2026' LIMIT 1),
  'Mikutano ya Injili Miwili',
  'Kufanya angalau mikutano miwili ya injili katika nusu mwaka - Mar na May (na CA''s)',
  'Mikutano ya Injili', '2', '0',
  'urgent', 'pending', 0, 1
),
(
  (SELECT id FROM strategic_plans WHERE title = 'Mkakati wa Uinjilisti 2026' LIMIT 1),
  'Makambi ya Uamsho',
  'Kufanya Makambi ya Uamsho (Jun 2-8) yenye ushiriki mkubwa - Miaka 13 ya Moto wa Uamsho',
  'Washiriki wa Makambi', '500', '0',
  'urgent', 'pending', 0, 2
),
(
  (SELECT id FROM strategic_plans WHERE title = 'Mkakati wa Uinjilisti 2026' LIMIT 1),
  'Ufuatiliaji na Ujumuishaji',
  'Kuhakikisha waliookoka wanafuatiliwa, wanapata DLD, na wanajiunga na jumuiya',
  'Asilimia ya waliofuatiliwa', '80%', '0%',
  'high', 'pending', 0, 3
);

-- =====================================================
-- 3. DEPARTMENT STRATEGIC PLAN: Youth (CA's)
-- =====================================================
INSERT INTO strategic_plans (
  title, vision, mission, description, scope,
  department_id, zone_id, year_start, year_end,
  status, created_by, is_active
) VALUES (
  'Mkakati wa Vijana (CA''s) 2026',
  'Vijana walio hai katika imani, wenye nguvu ya Roho, na wenye moyo wa kuinjilisha - Christ''s Ambassadors!',
  'Kujenga vijana katika imani, kuwaandaa kwa uongozi, na kuwatuma kuinjilisha',
  'Mpango Mkakati wa Idara ya Vijana (CA''s) kwa 2026. Wiki ya CA''s, Mkutano wa Injili, Mkesha, na programu za kujenga vijana.',
  'department',
  (SELECT id FROM departments WHERE name = 'Youth Department' LIMIT 1),
  NULL, 2026, 2026,
  'active',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  true
);

INSERT INTO strategic_goals (
  strategic_plan_id, title, description,
  target_metric, target_value, current_value,
  priority, status, progress, order_index
) VALUES
(
  (SELECT id FROM strategic_plans WHERE title LIKE 'Mkakati wa Vijana%2026' LIMIT 1),
  'Wiki ya CA''s yenye Mafanikio',
  'Kuendesha Wiki ndefu ya CA''s (Apr-Jun) yenye programu zenye ubora na ushiriki mkubwa',
  'Vijana walioshiriki', '200', '0',
  'urgent', 'pending', 0, 1
),
(
  (SELECT id FROM strategic_plans WHERE title LIKE 'Mkakati wa Vijana%2026' LIMIT 1),
  'Uinjilisti wa Vijana',
  'Kuendesha Mkutano wa Injili wa vijana (May 9-10) na kufikia vijana wasioamini',
  'Nafsi ziliookoka', '100', '0',
  'high', 'pending', 0, 2
),
(
  (SELECT id FROM strategic_plans WHERE title LIKE 'Mkakati wa Vijana%2026' LIMIT 1),
  'Maombi ya Vijana',
  'Kuendesha Mkesha wa CA''s (May 23) na kushiriki katika programu za maombi',
  'Washiriki wa Mkesha', '150', '0',
  'medium', 'pending', 0, 3
);

-- =====================================================
-- 4. DEPARTMENT STRATEGIC PLAN: Women (WWK)
-- =====================================================
INSERT INTO strategic_plans (
  title, vision, mission, description, scope,
  department_id, zone_id, year_start, year_end,
  status, created_by, is_active
) VALUES (
  'Mkakati wa WWK 2026',
  'Wanawake wenye nguvu ya Roho, wanaotumikia kanisa na jamii kwa upendo na hekima - Wanawake wa TAG!',
  'Kujenga wanawake katika imani, kuwawezesha kwa huduma, na kusaidia familia',
  'Mpango Mkakati wa Idara ya Wanawake (WWK) kwa 2026. Wiki ya WWK Taifa, Semina ya Mabinti, Mkutano Mkuu Dodoma.',
  'department',
  (SELECT id FROM departments WHERE name = 'Women''s Department' LIMIT 1),
  NULL, 2026, 2026,
  'active',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  true
);

INSERT INTO strategic_goals (
  strategic_plan_id, title, description,
  target_metric, target_value, current_value,
  priority, status, progress, order_index
) VALUES
(
  (SELECT id FROM strategic_plans WHERE title = 'Mkakati wa WWK 2026' LIMIT 1),
  'Wiki ya WWK na Semina',
  'Kuendesha Wiki ya WWK Taifa (Feb-Mar) yenye semina, mafundisho, na kilele yenye mafanikio',
  'Wanawake walioshiriki', '200', '0',
  'urgent', 'in_progress', 40, 1
),
(
  (SELECT id FROM strategic_plans WHERE title = 'Mkakati wa WWK 2026' LIMIT 1),
  'Kujenga Mabinti',
  'Kuendesha Semina ya Mabinti (Apr 21) - Kuandaa kizazi kijacho cha wanawake wa kanisa',
  'Mabinti walioshiriki', '80', '0',
  'high', 'pending', 0, 2
),
(
  (SELECT id FROM strategic_plans WHERE title = 'Mkakati wa WWK 2026' LIMIT 1),
  'Mkutano Mkuu WWK Dodoma',
  'Kushiriki katika Mkutano Mkuu wa WWK Taifa Dodoma (Jun 19+) - Kuwakilisha FCC',
  'Wajumbe wa FCC', '20', '0',
  'high', 'pending', 0, 3
);

-- =====================================================
-- 5. DEPARTMENT STRATEGIC PLAN: Men (CMF)
-- =====================================================
INSERT INTO strategic_plans (
  title, vision, mission, description, scope,
  department_id, zone_id, year_start, year_end,
  status, created_by, is_active
) VALUES (
  'Mkakati wa CMF 2026',
  'Wanaume wenye nguvu ya Roho, viongozi wa familia na kanisa - Christian Men''s Fellowship!',
  'Kujenga wanaume katika imani, uongozi, na uwajibikaji',
  'Mpango Mkakati wa Idara ya Wanaume (CMF) kwa 2026. Wiki ya CMF Taifa, Semina, Kilele.',
  'department',
  (SELECT id FROM departments WHERE name = 'Men''s Department' LIMIT 1),
  NULL, 2026, 2026,
  'active',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  true
);

INSERT INTO strategic_goals (
  strategic_plan_id, title, description,
  target_metric, target_value, current_value,
  priority, status, progress, order_index
) VALUES
(
  (SELECT id FROM strategic_plans WHERE title = 'Mkakati wa CMF 2026' LIMIT 1),
  'Wiki ya CMF yenye Mafanikio',
  'Kuendesha Wiki ya CMF Taifa (Apr 28 - May 4) yenye semina na kilele yenye ushiriki mkubwa',
  'Wanaume walioshiriki', '150', '0',
  'urgent', 'pending', 0, 1
),
(
  (SELECT id FROM strategic_plans WHERE title = 'Mkakati wa CMF 2026' LIMIT 1),
  'Kujenga Uongozi wa Wanaume',
  'Kuimarisha uongozi wa wanaume katika familia na kanisa kupitia semina na mafundisho',
  'Wanaume wa CMF', '100', '0',
  'high', 'pending', 0, 2
);

-- =====================================================
-- 6. DEPARTMENT STRATEGIC PLAN: Children (CMS)
-- =====================================================
INSERT INTO strategic_plans (
  title, vision, mission, description, scope,
  department_id, zone_id, year_start, year_end,
  status, created_by, is_active
) VALUES (
  'Mkakati wa CMS 2026',
  'Watoto wanaomjua Mungu tangu utotoni - Kizazi cha Roho Mtakatifu!',
  'Kuwalea watoto katika imani, kuwafundisha Neno la Mungu, na kuwaombea',
  'Mpango Mkakati wa Idara ya Watoto (CMS) kwa 2026. Wiki ya CMS, Kuombea Watoto kila mwezi, Kuweka Wakfu.',
  'department',
  (SELECT id FROM departments WHERE name = 'Children''s Department' LIMIT 1),
  NULL, 2026, 2026,
  'active',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  true
);

INSERT INTO strategic_goals (
  strategic_plan_id, title, description,
  target_metric, target_value, current_value,
  priority, status, progress, order_index
) VALUES
(
  (SELECT id FROM strategic_plans WHERE title = 'Mkakati wa CMS 2026' LIMIT 1),
  'Kuombea Watoto Kila Mwezi',
  'Kuendesha ibada ya Kuombea Watoto kila mwezi mfululizo - Imani kwa watoto wetu',
  'Ibada za Kuombea Watoto', '6', '2',
  'high', 'in_progress', 33, 1
),
(
  (SELECT id FROM strategic_plans WHERE title = 'Mkakati wa CMS 2026' LIMIT 1),
  'Wiki ya CMS yenye Mafanikio',
  'Kuendesha Wiki ya CMS (Jun 9-15) yenye semina ya walimu, kilele, na kuweka wakfu',
  'Watoto walioshiriki', '100', '0',
  'urgent', 'pending', 0, 2
),
(
  (SELECT id FROM strategic_plans WHERE title = 'Mkakati wa CMS 2026' LIMIT 1),
  'Kujenga Walimu wa Shule ya Jumapili',
  'Kuendesha Semina ya CMS (Jun 13-15) kwa walimu wa Shule ya Jumapili',
  'Walimu waliohitimu', '30', '0',
  'high', 'pending', 0, 3
);

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Strategic Plans Created:' as info, COUNT(*) as count 
FROM strategic_plans WHERE year_start = 2026 AND is_active = true;

SELECT sp.title, sp.scope,
  COALESCE(d.name, 'Church-wide') as department,
  (SELECT COUNT(*) FROM strategic_goals sg WHERE sg.strategic_plan_id = sp.id) as goal_count,
  (SELECT COUNT(*) FROM strategic_objectives so 
   INNER JOIN strategic_goals sg2 ON so.strategic_goal_id = sg2.id 
   WHERE sg2.strategic_plan_id = sp.id) as objective_count
FROM strategic_plans sp
LEFT JOIN departments d ON sp.department_id = d.id
WHERE sp.year_start = 2026 AND sp.is_active = true
ORDER BY sp.scope, sp.title;
