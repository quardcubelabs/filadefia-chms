-- =====================================================
-- FCC Church Calendar 2026 - Events Seed Script
-- KALENDA YA MWAKA 2026 FCC (January - June)
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Clear existing 2026 events to avoid duplicates
DELETE FROM events WHERE start_date >= '2026-01-01' AND start_date < '2026-07-01';

-- Helper variables for organizer and department lookups
-- Organizer: Use an administrator or pastor
-- Departments mapped from calendar:
--   WWK  → Women's Department
--   CMF  → Men's Department  
--   CA's → Youth Department
--   CMS  → Children's Department
--   DLD  → Discipleship & Teaching Department
--   Uinjilisti → Evangelism Department

INSERT INTO events (
  title, description, event_type, start_date, end_date,
  location, organizer_id, department_id,
  max_attendees, registration_required, registration_deadline, cost, is_active
) VALUES

-- =====================================================
-- JANUARY 2026
-- =====================================================

-- Jan 1: Ibada ya Mwaka Mpya (New Year Service)
(
  'Ibada ya Mwaka Mpya 2026',
  'Ibada maalum ya kuanza Mwaka Mpya 2026 - Kumshukuru Mungu na kujiandaa kwa mwaka mpya wa baraka',
  'fellowship',
  '2026-01-01 09:00:00+03',
  '2026-01-01 12:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  500, false, NULL, 0, true
),

-- Jan 3: TAG Shukrani Jimbo
(
  'TAG Shukrani Jimbo',
  'Ibada ya Shukrani ya TAG Jimbo - Kushukuru kwa mwaka uliopita na kuomba baraka za mwaka mpya',
  'conference',
  '2026-01-03 09:00:00+03',
  '2026-01-03 15:00:00+03',
  'Jimbo',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  1000, false, NULL, 0, true
),

-- Jan 4: Kuombea Watoto
(
  'Kuombea Watoto',
  'Ibada maalum ya kuwaombea watoto na vijana - Sala za ulinzi na baraka',
  'prayer_night',
  '2026-01-04 09:00:00+03',
  '2026-01-04 11:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Children''s Department' LIMIT 1),
  200, false, NULL, 0, true
),

-- Jan 11: Ibada ya Shukrani ya Mwaka
(
  'Ibada ya Shukrani ya Mwaka',
  'Ibada kuu ya Shukrani ya kuanza mwaka - Kanisa zima linakutana kushukuru kwa uaminifu wa Mungu',
  'fellowship',
  '2026-01-11 09:00:00+03',
  '2026-01-11 13:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  500, false, NULL, 0, true
),

-- Jan 12 - Feb 1: Maombi 21 ya Taifa (National 21-Day Prayer)
(
  'Maombi 21 ya Taifa',
  'Siku 21 za Maombi na Kufunga - Mpango wa Maombi wa Kitaifa uliowekwa na TAG Tanzania. Kanisa zima linashiriki katika maombi haya ya kitaifa',
  'prayer_night',
  '2026-01-12 06:00:00+03',
  '2026-02-01 21:00:00+03',
  'Hekalu Kuu - FCC na Online',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Prayer & Intercession Department' LIMIT 1),
  500, true, '2026-01-10 23:59:59+03', 0, true
),

-- Jan 25: Meza ya Bwana
(
  'Meza ya Bwana - Januari',
  'Ibada ya Meza ya Bwana na Ushirika Mtakatifu - Kukumbuka kifo na ufufuo wa Bwana wetu Yesu Kristo',
  'fellowship',
  '2026-01-25 09:00:00+03',
  '2026-01-25 12:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  500, false, NULL, 0, true
),

-- Jan 25-26: Sadaka ya Umisheni
(
  'Sadaka ya Umisheni - Januari',
  'Siku maalum ya Sadaka ya Umisheni - Kusaidia kazi ya Injili ndani na nje ya nchi',
  'fellowship',
  '2026-01-25 09:00:00+03',
  '2026-01-26 12:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Mission & Outreach Department' LIMIT 1),
  500, false, NULL, 0, true
),

-- Jan 30: Mkesha
(
  'Mkesha - Januari',
  'Usiku wa Maombi na Kuabudu - Mkesha wa kila mwezi kwa ajili ya maombi ya kanisa na taifa',
  'prayer_night',
  '2026-01-30 21:00:00+03',
  '2026-01-31 05:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Prayer & Intercession Department' LIMIT 1),
  300, false, NULL, 0, true
),

-- Jan 31: Matendo ya Ukarimu
(
  'Matendo ya Ukarimu - Januari',
  'Siku ya huduma ya jamii - Kutoa msaada, chakula, na upendo kwa wahitaji katika jamii yetu',
  'fellowship',
  '2026-01-31 08:00:00+03',
  '2026-01-31 14:00:00+03',
  'Jamii / Community',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Welfare & Counseling Department' LIMIT 1),
  100, false, NULL, 0, true
),

-- =====================================================
-- FEBRUARY 2026
-- =====================================================

-- Feb 2-8: Wiki ya Wazee (Elders Week)
(
  'Wiki ya Wazee',
  'Wiki maalum ya Baraza la Wazee - Mafundisho, maombi, na mipango ya uongozi wa kanisa',
  'conference',
  '2026-02-02 09:00:00+03',
  '2026-02-08 17:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  100, true, '2026-01-30 23:59:59+03', 0, true
),

-- Feb 8: Kuombea Watoto
(
  'Kuombea Watoto - Februari',
  'Ibada maalum ya kuwaombea watoto na vijana wa kanisa letu',
  'prayer_night',
  '2026-02-08 09:00:00+03',
  '2026-02-08 11:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Children''s Department' LIMIT 1),
  200, false, NULL, 0, true
),

-- Feb 14: Kongamano Viongozi Jimbo
(
  'Kongamano Viongozi Jimbo',
  'Kongamano la Viongozi wa Jimbo - Mkutano wa uongozi kwa viongozi wa makanisa ndani ya Jimbo',
  'conference',
  '2026-02-14 08:00:00+03',
  '2026-02-14 17:00:00+03',
  'Jimbo',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  200, true, '2026-02-12 23:59:59+03', 0, true
),

-- Feb 15: Ibada ya Ubatizo / DLD
(
  'Ibada ya Ubatizo na DLD',
  'Ibada maalum ya Ubatizo wa Maji - Wanafunzi wapya wa Darasa la Dini (DLD) wanabatizwa na kupokewa kanisani',
  'fellowship',
  '2026-02-15 09:00:00+03',
  '2026-02-15 13:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Discipleship & Teaching Department' LIMIT 1),
  500, true, '2026-02-13 23:59:59+03', 0, true
),

-- Feb 20: Mkesha
(
  'Mkesha - Februari',
  'Usiku wa Maombi na Kuabudu - Mkesha wa kanisa',
  'prayer_night',
  '2026-02-20 21:00:00+03',
  '2026-02-21 05:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Prayer & Intercession Department' LIMIT 1),
  300, false, NULL, 0, true
),

-- Feb 22: Meza ya Bwana
(
  'Meza ya Bwana - Februari',
  'Ibada ya Meza ya Bwana na Ushirika Mtakatifu',
  'fellowship',
  '2026-02-22 09:00:00+03',
  '2026-02-22 12:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  500, false, NULL, 0, true
),

-- Feb 22-23: Sadaka ya Umisheni
(
  'Sadaka ya Umisheni - Februari',
  'Siku maalum ya Sadaka ya Umisheni - Kusaidia kazi ya Injili',
  'fellowship',
  '2026-02-22 09:00:00+03',
  '2026-02-23 12:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Mission & Outreach Department' LIMIT 1),
  500, false, NULL, 0, true
),

-- Feb 23 - Mar 1: Wiki ya WWK Taifa (National Women's Week)
(
  'Wiki ya WWK Taifa',
  'Wiki maalum ya Wanawake wa Kanisa (WWK) - Mpango wa Kitaifa. Semina, maombi, na sherehe za idara ya wanawake',
  'conference',
  '2026-02-23 09:00:00+03',
  '2026-03-01 17:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Women''s Department' LIMIT 1),
  300, true, '2026-02-20 23:59:59+03', 0, true
),

-- Feb 25 - Mar 1: Semina ya WWK
(
  'Semina ya WWK',
  'Semina maalum katika Wiki ya WWK - Mafundisho na kujenga uwezo wa wanawake wa kanisa',
  'seminar',
  '2026-02-25 09:00:00+03',
  '2026-03-01 17:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Women''s Department' LIMIT 1),
  200, true, '2026-02-23 23:59:59+03', 0, true
),

-- Feb 28: Matendo ya Ukarimu
(
  'Matendo ya Ukarimu - Februari',
  'Siku ya huduma ya jamii - Kutoa msaada kwa wahitaji',
  'fellowship',
  '2026-02-28 08:00:00+03',
  '2026-02-28 14:00:00+03',
  'Jamii / Community',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Welfare & Counseling Department' LIMIT 1),
  100, false, NULL, 0, true
),

-- =====================================================
-- MARCH 2026
-- =====================================================

-- Mar 1: WWK Kilele (Women's Week Climax)
(
  'Kilele ya Wiki ya WWK',
  'Ibada ya Kilele ya Wiki ya Wanawake wa Kanisa - Sherehe na Ibada ya kumalizia wiki ya WWK Taifa',
  'conference',
  '2026-03-01 09:00:00+03',
  '2026-03-01 15:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Women''s Department' LIMIT 1),
  500, false, NULL, 0, true
),

-- Mar 8: Semina Roho Mtakatifu Section
(
  'Semina Roho Mtakatifu - Section',
  'Semina kuhusu Roho Mtakatifu - Mafundisho ya kina kuhusu nguvu na kazi ya Roho Mtakatifu katika maisha ya Mkristo. Ngazi ya Section',
  'seminar',
  '2026-03-08 09:00:00+03',
  '2026-03-08 16:00:00+03',
  'Section',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Discipleship & Teaching Department' LIMIT 1),
  300, true, '2026-03-06 23:59:59+03', 0, true
),

-- Mar 11-15: Mkutano wa Injili (Evangelistic Crusade)
(
  'Mkutano wa Injili',
  'Mkutano mkubwa wa Injili - Siku tano za kuhubiri Injili kwa nguvu, uponyaji, na ukombozi. Waalika majirani na marafiki',
  'crusade',
  '2026-03-11 16:00:00+03',
  '2026-03-15 21:00:00+03',
  'Uwanja wa FCC / Open Ground',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Evangelism Department' LIMIT 1),
  2000, false, NULL, 0, true
),

-- Mar 18-22: Semina (Teaching Seminar)
(
  'Semina ya Mafundisho - Machi',
  'Semina ya wiki ya mafundisho ya Neno la Mungu - Kujenga imani na maarifa ya Biblia',
  'seminar',
  '2026-03-18 18:00:00+03',
  '2026-03-22 20:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Discipleship & Teaching Department' LIMIT 1),
  300, false, NULL, 0, true
),

-- Mar 23: Meza ya Bwana
(
  'Meza ya Bwana - Machi',
  'Ibada ya Meza ya Bwana na Ushirika Mtakatifu',
  'fellowship',
  '2026-03-23 09:00:00+03',
  '2026-03-23 12:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  500, false, NULL, 0, true
),

-- Mar 28: Mkesha
(
  'Mkesha - Machi',
  'Usiku wa Maombi na Kuabudu',
  'prayer_night',
  '2026-03-28 21:00:00+03',
  '2026-03-29 05:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Prayer & Intercession Department' LIMIT 1),
  300, false, NULL, 0, true
),

-- Mar 30: Kuombea Watoto
(
  'Kuombea Watoto - Machi',
  'Ibada maalum ya kuwaombea watoto',
  'prayer_night',
  '2026-03-30 09:00:00+03',
  '2026-03-30 11:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Children''s Department' LIMIT 1),
  200, false, NULL, 0, true
),

-- Mar 30: Sadaka ya Umisheni
(
  'Sadaka ya Umisheni - Machi',
  'Siku maalum ya Sadaka ya Umisheni',
  'fellowship',
  '2026-03-30 09:00:00+03',
  '2026-03-30 12:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Mission & Outreach Department' LIMIT 1),
  500, false, NULL, 0, true
),

-- Mar 30: Matendo ya Ukarimu
(
  'Matendo ya Ukarimu - Machi',
  'Siku ya huduma ya jamii',
  'fellowship',
  '2026-03-30 14:00:00+03',
  '2026-03-30 17:00:00+03',
  'Jamii / Community',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Welfare & Counseling Department' LIMIT 1),
  100, false, NULL, 0, true
),

-- Mar 31: TATHMINI YA UTENDAJI ROBO MWAKA (Q1 Evaluation)
(
  'Tathmini ya Utendaji Robo Mwaka ya Kwanza',
  'Tathmini ya utendaji wa Robo ya Kwanza (Januari - Machi 2026). Idara zote zinawasilisha ripoti zao na kufanya tathmini ya malengo na mipango',
  'conference',
  '2026-03-31 09:00:00+03',
  '2026-03-31 16:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  100, true, '2026-03-28 23:59:59+03', 0, true
),

-- =====================================================
-- APRIL 2026
-- =====================================================

-- Apr 1 - Jun 1: Wiki ya CA's (Youth - Christ's Ambassadors)
(
  'Wiki ya CA''s (Vijana)',
  'Wiki maalum ya Christ''s Ambassadors - Programu ndefu ya vijana wa kanisa yenye shughuli mbalimbali za kiroho na kijamii',
  'conference',
  '2026-04-01 09:00:00+03',
  '2026-06-01 17:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Youth Department' LIMIT 1),
  300, true, '2026-03-28 23:59:59+03', 0, true
),

-- Apr 12: Semina Viongozi Section
(
  'Semina Viongozi - Section',
  'Semina ya Viongozi ngazi ya Section - Kujenga uwezo wa uongozi wa kanisa',
  'seminar',
  '2026-04-12 09:00:00+03',
  '2026-04-12 16:00:00+03',
  'Section',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  150, true, '2026-04-10 23:59:59+03', 0, true
),

-- Apr 16-20: Semina ya Pasaka (Easter Seminar)
(
  'Semina ya Pasaka',
  'Semina maalum ya Juma la Pasaka - Mafundisho ya kina kuhusu mateso, kifo, na ufufuo wa Kristo',
  'seminar',
  '2026-04-16 18:00:00+03',
  '2026-04-20 20:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Discipleship & Teaching Department' LIMIT 1),
  400, false, NULL, 0, true
),

-- Apr 18: Ijumaa Kuu (Good Friday)
(
  'Ibada ya Ijumaa Kuu',
  'Ibada maalum ya Ijumaa Kuu - Kukumbuka mateso na kifo cha Bwana wetu Yesu Kristo msalabani',
  'fellowship',
  '2026-04-18 09:00:00+03',
  '2026-04-18 15:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  500, false, NULL, 0, true
),

-- Apr 20: Pasaka (Easter Sunday)
(
  'Ibada ya Pasaka',
  'Sherehe ya Ufufuo wa Bwana wetu Yesu Kristo - Kristo amefufuka! Ibada ya furaha na ushindi',
  'fellowship',
  '2026-04-20 07:00:00+03',
  '2026-04-20 13:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  500, false, NULL, 0, true
),

-- Apr 20: Meza ya Bwana
(
  'Meza ya Bwana - Aprili (Pasaka)',
  'Ibada ya Meza ya Bwana siku ya Pasaka',
  'fellowship',
  '2026-04-20 09:00:00+03',
  '2026-04-20 12:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  500, false, NULL, 0, true
),

-- Apr 21: Semina ya Mabinti
(
  'Semina ya Mabinti',
  'Semina maalum kwa mabinti na wasichana wa kanisa - Mafundisho ya kiroho, maadili, na maisha ya Kikristo',
  'seminar',
  '2026-04-21 09:00:00+03',
  '2026-04-21 16:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Women''s Department' LIMIT 1),
  150, true, '2026-04-19 23:59:59+03', 0, true
),

-- Apr 25: Mkesha
(
  'Mkesha - Aprili',
  'Usiku wa Maombi na Kuabudu',
  'prayer_night',
  '2026-04-25 21:00:00+03',
  '2026-04-26 05:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Prayer & Intercession Department' LIMIT 1),
  300, false, NULL, 0, true
),

-- Apr 25-26: Kongamano Maombi Uamsho Section
(
  'Kongamano Maombi ya Uamsho - Section',
  'Kongamano la Maombi ya Uamsho ngazi ya Section - Siku mbili za maombi ya nguvu kwa ajili ya uamsho katika eneo letu',
  'conference',
  '2026-04-25 09:00:00+03',
  '2026-04-26 17:00:00+03',
  'Section',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Prayer & Intercession Department' LIMIT 1),
  500, true, '2026-04-23 23:59:59+03', 0, true
),

-- Apr 27: Sadaka ya Umisheni
(
  'Sadaka ya Umisheni - Aprili',
  'Siku maalum ya Sadaka ya Umisheni',
  'fellowship',
  '2026-04-27 09:00:00+03',
  '2026-04-27 12:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Mission & Outreach Department' LIMIT 1),
  500, false, NULL, 0, true
),

-- Apr 27: Kuombea Watoto
(
  'Kuombea Watoto - Aprili',
  'Ibada maalum ya kuwaombea watoto',
  'prayer_night',
  '2026-04-27 09:00:00+03',
  '2026-04-27 11:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Children''s Department' LIMIT 1),
  200, false, NULL, 0, true
),

-- Apr 28 - May 4: Wiki ya CMF Taifa (National Men's Week)
(
  'Wiki ya CMF Taifa',
  'Wiki maalum ya Christian Men''s Fellowship (CMF) - Mpango wa Kitaifa wa wanaume wa kanisa. Semina, maombi, na shughuli mbalimbali',
  'conference',
  '2026-04-28 09:00:00+03',
  '2026-05-04 17:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Men''s Department' LIMIT 1),
  250, true, '2026-04-25 23:59:59+03', 0, true
),

-- Apr 30: Matendo ya Ukarimu
(
  'Matendo ya Ukarimu - Aprili',
  'Siku ya huduma ya jamii',
  'fellowship',
  '2026-04-30 08:00:00+03',
  '2026-04-30 14:00:00+03',
  'Jamii / Community',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Welfare & Counseling Department' LIMIT 1),
  100, false, NULL, 0, true
),

-- =====================================================
-- MAY 2026
-- =====================================================

-- May 1-4: CMF Semina
(
  'Semina ya CMF',
  'Semina maalum katika Wiki ya CMF - Mafundisho na kujenga uwezo wa wanaume wa kanisa',
  'seminar',
  '2026-05-01 18:00:00+03',
  '2026-05-04 20:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Men''s Department' LIMIT 1),
  200, true, '2026-04-29 23:59:59+03', 0, true
),

-- May 4: CMF Kilele
(
  'Kilele ya Wiki ya CMF',
  'Ibada ya Kilele ya Wiki ya Wanaume wa Kanisa (CMF Taifa) - Sherehe na Ibada ya kumalizia wiki',
  'conference',
  '2026-05-04 09:00:00+03',
  '2026-05-04 15:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Men''s Department' LIMIT 1),
  500, false, NULL, 0, true
),

-- May 9-10: Mkutano wa Injili CA's Section
(
  'Mkutano wa Injili CA''s - Section',
  'Mkutano wa Injili unaopangwa na CA''s (Vijana) ngazi ya Section - Vijana wanahubiri Injili kwa nguvu',
  'crusade',
  '2026-05-09 16:00:00+03',
  '2026-05-10 21:00:00+03',
  'Section',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Youth Department' LIMIT 1),
  1000, false, NULL, 0, true
),

-- May 12-18: Maombi ya Kanisa
(
  'Wiki ya Maombi ya Kanisa - Mei',
  'Wiki nzima ya maombi ya kanisa - Siku saba za maombi makini kwa ajili ya kanisa na familia',
  'prayer_night',
  '2026-05-12 06:00:00+03',
  '2026-05-18 21:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Prayer & Intercession Department' LIMIT 1),
  300, false, NULL, 0, true
),

-- May 13-19: Wiki ya Pentekoste Taifa (National Pentecost Week)
(
  'Wiki ya Pentekoste Taifa',
  'Wiki maalum ya Pentekoste - Mpango wa Kitaifa wa TAG kusherehekea nguvu ya Roho Mtakatifu. Mafundisho, maombi, na uamsho',
  'conference',
  '2026-05-13 09:00:00+03',
  '2026-05-19 17:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  500, true, '2026-05-10 23:59:59+03', 0, true
),

-- May 15-19: Semina ya Pentekoste
(
  'Semina ya Pentekoste',
  'Semina maalum katika Wiki ya Pentekoste - Mafundisho ya kina kuhusu karama za Roho Mtakatifu',
  'seminar',
  '2026-05-15 18:00:00+03',
  '2026-05-19 20:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Discipleship & Teaching Department' LIMIT 1),
  300, false, NULL, 0, true
),

-- May 18: Meza ya Bwana
(
  'Meza ya Bwana - Mei',
  'Ibada ya Meza ya Bwana na Ushirika Mtakatifu',
  'fellowship',
  '2026-05-18 09:00:00+03',
  '2026-05-18 12:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  500, false, NULL, 0, true
),

-- May 18: Kuombea Watoto
(
  'Kuombea Watoto - Mei',
  'Ibada maalum ya kuwaombea watoto',
  'prayer_night',
  '2026-05-18 09:00:00+03',
  '2026-05-18 11:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Children''s Department' LIMIT 1),
  200, false, NULL, 0, true
),

-- May 23: Mkesha CA's
(
  'Mkesha wa CA''s (Vijana)',
  'Mkesha maalum wa vijana - Christ''s Ambassadors wanakusanyika kwa usiku wa maombi na ibada',
  'prayer_night',
  '2026-05-23 21:00:00+03',
  '2026-05-24 05:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Youth Department' LIMIT 1),
  200, false, NULL, 0, true
),

-- May 25: Sadaka ya Umisheni
(
  'Sadaka ya Umisheni - Mei',
  'Siku maalum ya Sadaka ya Umisheni',
  'fellowship',
  '2026-05-25 09:00:00+03',
  '2026-05-25 12:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Mission & Outreach Department' LIMIT 1),
  500, false, NULL, 0, true
),

-- May 30: Mkesha Wazee
(
  'Mkesha wa Wazee',
  'Mkesha maalum wa Baraza la Wazee - Usiku wa maombi na uongozi',
  'prayer_night',
  '2026-05-30 21:00:00+03',
  '2026-05-31 05:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  50, true, '2026-05-28 23:59:59+03', 0, true
),

-- May 30: Mkesha Section
(
  'Mkesha - Section (Mei)',
  'Mkesha wa pamoja ngazi ya Section',
  'prayer_night',
  '2026-05-30 21:00:00+03',
  '2026-05-31 05:00:00+03',
  'Section',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Prayer & Intercession Department' LIMIT 1),
  500, false, NULL, 0, true
),

-- May 31: Matendo ya Ukarimu
(
  'Matendo ya Ukarimu - Mei',
  'Siku ya huduma ya jamii',
  'fellowship',
  '2026-05-31 08:00:00+03',
  '2026-05-31 14:00:00+03',
  'Jamii / Community',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Welfare & Counseling Department' LIMIT 1),
  100, false, NULL, 0, true
),

-- =====================================================
-- JUNE 2026
-- =====================================================

-- Jun 2-8: Pentekoste / Makambi ya Uamsho
(
  'Pentekoste - Makambi ya Uamsho',
  'Wiki ya Pentekoste na Makambi ya Uamsho - Siku 7 za ibada, maombi, mafundisho, na uamsho mkubwa. Miaka 13 ya Moto wa Uamsho!',
  'conference',
  '2026-06-02 09:00:00+03',
  '2026-06-08 21:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  1000, true, '2026-05-30 23:59:59+03', 0, true
),

-- Jun 9-15: Wiki ya CMS (Children's Ministry)
(
  'Wiki ya CMS (Watoto)',
  'Wiki maalum ya Children''s Ministry (CMS) - Programu za watoto, mafundisho, michezo, na sherehe za idara ya watoto',
  'conference',
  '2026-06-09 09:00:00+03',
  '2026-06-15 17:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Children''s Department' LIMIT 1),
  200, true, '2026-06-06 23:59:59+03', 0, true
),

-- Jun 13-15: Semina ya CMS
(
  'Semina ya CMS',
  'Semina maalum kwa walimu wa Shule ya Jumapili na viongozi wa watoto',
  'seminar',
  '2026-06-13 09:00:00+03',
  '2026-06-15 16:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Children''s Department' LIMIT 1),
  100, true, '2026-06-11 23:59:59+03', 0, true
),

-- Jun 15: Kilele ya CMS
(
  'Kilele ya Wiki ya CMS',
  'Ibada ya Kilele ya Wiki ya Watoto - Sherehe, maonyesho, na ibada maalum ya watoto',
  'conference',
  '2026-06-15 09:00:00+03',
  '2026-06-15 14:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Children''s Department' LIMIT 1),
  500, false, NULL, 0, true
),

-- Jun 15: Kuombea Watoto / Kuweka Wakfu
(
  'Kuombea Watoto na Kuweka Wakfu',
  'Ibada maalum ya kuwaombea watoto na kuwaweka wakfu kwa Bwana',
  'fellowship',
  '2026-06-15 09:00:00+03',
  '2026-06-15 12:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Children''s Department' LIMIT 1),
  500, false, NULL, 0, true
),

-- Jun 19 - Sep 20: Mkutano Mkuu WWK Dodoma Taifa
(
  'Mkutano Mkuu WWK Dodoma - Taifa',
  'Mkutano Mkuu wa Wanawake wa TAG (WWK) ngazi ya Taifa unaofanyika Dodoma. Mkutano mkubwa wa kila mwaka wa wanawake',
  'conference',
  '2026-06-19 09:00:00+03',
  '2026-06-22 17:00:00+03',
  'Dodoma - TAG Makao Makuu',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Women''s Department' LIMIT 1),
  50, true, '2026-06-15 23:59:59+03', 0, true
),

-- Jun 22: Semina Wanandoa
(
  'Semina ya Wanandoa',
  'Semina maalum kwa wanandoa - Mafundisho ya kuimarisha ndoa na familia kwa misingi ya Biblia',
  'seminar',
  '2026-06-22 14:00:00+03',
  '2026-06-22 18:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Welfare & Counseling Department' LIMIT 1),
  100, true, '2026-06-20 23:59:59+03', 0, true
),

-- Jun 25-29: Semina ya Maombi
(
  'Semina ya Maombi',
  'Semina ya kina kuhusu maombi - Mafundisho ya nguvu na aina za maombi, vita vya rohoni, na maombi ya ushindi',
  'seminar',
  '2026-06-25 18:00:00+03',
  '2026-06-29 20:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Prayer & Intercession Department' LIMIT 1),
  300, false, NULL, 0, true
),

-- Jun 27: Mkesha
(
  'Mkesha - Juni',
  'Usiku wa Maombi na Kuabudu',
  'prayer_night',
  '2026-06-27 21:00:00+03',
  '2026-06-28 05:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Prayer & Intercession Department' LIMIT 1),
  300, false, NULL, 0, true
),

-- Jun 29: Sadaka ya Umisheni
(
  'Sadaka ya Umisheni - Juni',
  'Siku maalum ya Sadaka ya Umisheni',
  'fellowship',
  '2026-06-29 09:00:00+03',
  '2026-06-29 12:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Mission & Outreach Department' LIMIT 1),
  500, false, NULL, 0, true
),

-- Jun 29: Meza ya Bwana
(
  'Meza ya Bwana - Juni',
  'Ibada ya Meza ya Bwana na Ushirika Mtakatifu',
  'fellowship',
  '2026-06-29 09:00:00+03',
  '2026-06-29 12:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  500, false, NULL, 0, true
),

-- Jun 30: Matendo ya Ukarimu
(
  'Matendo ya Ukarimu - Juni',
  'Siku ya huduma ya jamii',
  'fellowship',
  '2026-06-30 08:00:00+03',
  '2026-06-30 14:00:00+03',
  'Jamii / Community',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  (SELECT id FROM departments WHERE name = 'Welfare & Counseling Department' LIMIT 1),
  100, false, NULL, 0, true
),

-- Jun 30: TATHMINI YA UTENDAJI NA RIPOTI ZA NUSU MWAKA (Mid-Year Evaluation)
(
  'Tathmini ya Utendaji na Ripoti za Nusu Mwaka',
  'Tathmini ya utendaji wa Nusu Mwaka ya Kwanza (Januari - Juni 2026). Idara zote zinawasilisha ripoti kamili na kufanya tathmini ya kina ya malengo, fedha, na mipango ya nusu mwaka iliyobaki',
  'conference',
  '2026-06-30 09:00:00+03',
  '2026-06-30 17:00:00+03',
  'Hekalu Kuu - FCC',
  (SELECT id FROM profiles WHERE role IN ('administrator', 'pastor') LIMIT 1),
  NULL,
  100, true, '2026-06-27 23:59:59+03', 0, true
);

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'Total 2026 Events Created:' as info, COUNT(*) as count 
FROM events WHERE start_date >= '2026-01-01' AND start_date < '2026-07-01';

SELECT event_type, COUNT(*) as count 
FROM events 
WHERE start_date >= '2026-01-01' AND start_date < '2026-07-01'
GROUP BY event_type 
ORDER BY count DESC;

SELECT 
  EXTRACT(MONTH FROM start_date) as month,
  COUNT(*) as events_count
FROM events 
WHERE start_date >= '2026-01-01' AND start_date < '2026-07-01'
GROUP BY EXTRACT(MONTH FROM start_date)
ORDER BY month;
