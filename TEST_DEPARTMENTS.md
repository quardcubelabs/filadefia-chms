# Testing Departments Page

## Issue
Departments page is loading infinitely without showing results.

## Possible Causes

### 1. No Departments in Database
The seed data may not have been inserted. Check by running this in Supabase SQL Editor:

```sql
SELECT * FROM departments;
```

If empty, run the insert from `database/schema.sql`:

```sql
INSERT INTO departments (name, swahili_name, description) VALUES
('Youth Department', 'Vijana – TAG Youth Movement', 'Ministry for young people aged 15-35'),
('Women''s Department', 'Wanawake wa TAG / Women''s Fellowship', 'Ministry for women of all ages'),
('Men''s Department', 'Wanaume wa TAG / Brotherhood Ministry', 'Ministry for men of all ages'),
('Children''s Department', 'Watoto / Sunday School Ministry', 'Ministry for children under 15 years'),
('Evangelism Department', 'Huduma ya Uinjilisti', 'Outreach and evangelistic activities'),
('Choir & Praise Team', 'Huduma ya Uimbaji / Praise & Worship', 'Music and worship ministry'),
('Prayer & Intercession Department', 'Huduma ya Maombi na Maombezi', 'Prayer ministry and intercession'),
('Ushering Department', 'Huduma ya Ukarimu / Usher Ministry', 'Hospitality and ushering services'),
('Media & Technical Department', 'Huduma ya Vyombo vya Habari na Teknolojia', 'Audio/visual and technical support'),
('Discipleship & Teaching Department', 'Huduma ya Mafundisho na Ushirika', 'Teaching and discipleship programs'),
('Mission & Outreach Department', 'Huduma ya Misioni na Nje', 'Mission work and community outreach'),
('Welfare & Counseling Department', 'Huduma ya Kiroho na Kijamii', 'Counseling and welfare services');
```

### 2. RLS Policy Blocking Access
Check if RLS policies allow reading departments:

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'departments';

-- If needed, add a policy to allow authenticated users to read departments
CREATE POLICY "Authenticated users can view departments" 
ON departments FOR SELECT 
USING (auth.role() = 'authenticated');
```

### 3. Browser Console Errors
Open browser DevTools (F12) and check the Console tab for errors.

Look for:
- "Fetching departments..."
- "Departments fetched: ..."
- Any error messages

## Quick Fix Steps

1. **Check Browser Console** (F12 → Console tab)
   - Look for the log messages we added
   - Note any errors

2. **Verify Departments Exist**
   - Go to Supabase Dashboard → Table Editor → departments
   - Should see 12 departments listed

3. **Check RLS Policies**
   - Go to Supabase Dashboard → Authentication → Policies
   - Look for departments table
   - Ensure there's a SELECT policy for authenticated users

4. **Test Query Manually**
   - Go to Supabase Dashboard → SQL Editor
   - Run: `SELECT * FROM departments WHERE is_active = true ORDER BY name;`
   - Should return 12 rows

## What the Console Should Show

If working correctly:
```
Auth state: {user: true, authLoading: false, supabase: true}
Fetching departments...
Departments fetched: (12) [{...}, {...}, ...] Error: null
Departments with stats: (12) [{...}, {...}, ...]
```

If there's an error:
```
Auth state: {user: true, authLoading: false, supabase: true}
Fetching departments...
Departments fetched: null Error: {...}
Error fetching departments: ...
```
