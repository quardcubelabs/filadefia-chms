# Admin Access Setup Guide

## Problem
You're logged in but can't see members or departments because your account doesn't have admin role in the profiles table.

## Solution - Follow These Steps EXACTLY

### Step 1: Find Your User ID in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find your email in the list
3. Click on your email
4. **Copy your User ID** (UUID like `a1b2c3d4-...`)

### Step 2: Check If Your Profile Exists

Run this query in **SQL Editor**:

```sql
SELECT * FROM profiles WHERE user_id = 'PASTE-YOUR-USER-ID-HERE';
```

**If you get NO results**, your profile doesn't exist yet.

### Step 3A: If Profile EXISTS - Update Role to Admin

```sql
UPDATE profiles 
SET role = 'administrator' 
WHERE user_id = 'PASTE-YOUR-USER-ID-HERE';
```

### Step 3B: If Profile DOESN'T EXIST - Create Admin Profile

Replace the values with YOUR information:

```sql
INSERT INTO profiles (user_id, email, role, first_name, last_name)
VALUES (
  'PASTE-YOUR-USER-ID-HERE',
  'your-actual-email@example.com',
  'administrator',
  'Your First Name',
  'Your Last Name'
);
```

### Step 4: Apply RLS Policies

Run the entire contents of `database/migrations/fix_admin_access.sql` in **SQL Editor**

### Step 5: Verify Admin Access

Run this query to confirm you're an admin:

```sql
SELECT 
  p.id,
  p.email,
  p.role,
  p.first_name,
  p.last_name
FROM profiles p
WHERE p.user_id = auth.uid();
```

You should see your profile with `role = 'administrator'`

### Step 6: Refresh Your App

1. Log out of the application
2. Log back in
3. Navigate to Members or Departments page
4. You should now see data!

## Troubleshooting

**Still not working?**

1. Make sure you're logged in with the same email
2. Check browser console for errors (F12)
3. Verify your profile role is 'administrator' not 'member'
4. Clear browser cache and cookies
5. Try logging out and back in

## Security Note

Only users with these roles can access the system:
- **administrator** - Full access to everything
- **pastor** - Full access to everything
- **secretary** - Can manage members and departments

Regular members CANNOT log into the admin system. They are just records in the members table.
