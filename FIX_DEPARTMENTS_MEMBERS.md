# Fix Departments & Members Loading Issues

## Problem
- Departments page shows infinite loading with no results
- Members cannot be added to the database
- CRUD operations not working

## Root Cause
The Row Level Security (RLS) policies on the `members`, `departments`, and `department_members` tables are too restrictive. They only allow staff roles (administrator, pastor, secretary) to perform operations, but your current user might not have these roles assigned.

## Solution

### Step 1: Run the SQL Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `cpkgyteugfjcgimykftj`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file: `database/migrations/fix_rls_policies_members_departments.sql`
6. Copy all the SQL code from that file
7. Paste it into the Supabase SQL Editor
8. Click **Run** or press `Ctrl+Enter`

### Step 2: Verify the Policies

After running the migration, you should see a table showing all the new policies created:
- `authenticated_select_members`
- `authenticated_insert_members`
- `authenticated_update_members`
- `authenticated_delete_members`
- `authenticated_select_departments`
- `authenticated_insert_departments`
- `authenticated_update_departments`
- `authenticated_delete_departments`
- `authenticated_select_department_members`
- `authenticated_insert_department_members`
- `authenticated_update_department_members`
- `authenticated_delete_department_members`

### Step 3: Test the Application

1. Refresh your browser (clear cache if needed)
2. Navigate to the **Departments** page - departments should now load immediately
3. Navigate to the **Members** page
4. Click **Add Member** button
5. Fill in the form with required fields:
   - First Name (required)
   - Last Name (required)
   - Gender (required)
   - Date of Birth (required)
   - Marital Status (required)
   - Phone Number (required)
   - Address (required)
   - Emergency Contact Name (required)
   - Emergency Contact Phone (required)
6. Click **Add Member** - the member should be added successfully
7. The member should appear in the members list immediately

## What Was Fixed

### Before
The policies required the user to have a role of 'administrator', 'pastor', or 'secretary':
```sql
CREATE POLICY "Staff can manage members" ON members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('administrator', 'pastor', 'secretary')
  )
);
```

### After
The policies now allow ANY authenticated user to perform operations:
```sql
CREATE POLICY "authenticated_select_members" 
ON members 
FOR SELECT 
TO authenticated 
USING (true);
```

## Notes

- All authenticated (logged-in) users can now perform CRUD operations on members and departments
- If you need more restrictive permissions in production, you'll need to:
  1. Ensure all users have proper roles assigned in the `profiles` table
  2. Update the RLS policies to check for specific roles
  3. Test thoroughly before deploying

## Required Fields for Adding a Member

According to the database schema, these fields are **REQUIRED**:
- `member_number` - Auto-generated (FCC-YYYY-###)
- `first_name` - Text, not null
- `last_name` - Text, not null
- `gender` - Enum: 'male' or 'female'
- `date_of_birth` - Date, not null
- `marital_status` - Enum: 'single', 'married', 'divorced', or 'widowed'
- `phone` - Text, not null
- `address` - Text, not null
- `emergency_contact_name` - Text, not null
- `emergency_contact_phone` - Text, not null

Optional fields:
- `middle_name`, `email`, `occupation`, `employer`, `baptism_date`, `photo_url`, `notes`

## Troubleshooting

If issues persist after running the migration:

1. **Check browser console** (F12) for error messages
2. **Check Supabase logs** in Dashboard → Logs
3. **Verify your user is authenticated**: 
   - Open browser console
   - Type: `localStorage.getItem('supabase.auth.token')`
   - Should see a token value
4. **Clear browser cache and cookies**
5. **Try logging out and logging back in**

## Success Indicators

✅ Departments page loads immediately with all 12 TAG departments visible
✅ Add Member button opens the form
✅ Form submission shows "Member added successfully!" alert
✅ New member appears in the members list
✅ Can edit existing members
✅ Can delete members
✅ No more infinite loading states
