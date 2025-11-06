# Database Migrations

This folder contains database migration scripts for the FCC Church Management System.

## How to Apply Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the content of the migration file you want to apply
5. Paste it into the SQL editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

```bash
# Navigate to your project directory
cd fcc-chms

# Run the migration
supabase db push database/migrations/add_user_profile_trigger.sql
```

## Available Migrations

### 1. `add_user_profile_trigger.sql`
**Purpose:** Automatically creates a profile record when a new user signs up.

**What it does:**
- Creates a trigger function that runs when a new user is created in `auth.users`
- Automatically inserts a corresponding record in the `profiles` table
- Backfills profiles for any existing users who don't have profiles yet
- Sets default role to 'member' for new users

**When to run:** 
- If you're getting "Profile not found" errors when logging in
- After initial database setup
- If you have existing users without profiles

**How to verify it worked:**
1. Sign up a new user
2. Check the `profiles` table - you should see a new record
3. The `user_id` should match the `id` in `auth.users`

## Migration Order

1. First, ensure your base schema is set up using `database/schema.sql`
2. Then apply `add_user_profile_trigger.sql`

## Troubleshooting

**Error: "function handle_new_user() already exists"**
- This is normal if you're re-running the migration
- The `CREATE OR REPLACE FUNCTION` will update the existing function

**Error: "permission denied"**
- Make sure you're running the migration with the service_role key or as a superuser
- In Supabase dashboard, you have the necessary permissions by default

**Profiles not being created automatically**
- Check if the trigger exists:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```
- Check if the function exists:
  ```sql
  SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
  ```

## Testing the Migration

After applying the migration, test it by:

1. Creating a new user via the signup page
2. Checking the database:
   ```sql
   SELECT p.*, u.email 
   FROM profiles p 
   JOIN auth.users u ON p.user_id = u.id 
   ORDER BY p.created_at DESC 
   LIMIT 5;
   ```

You should see profiles created automatically with:
- `role` = 'member'
- `first_name` extracted from email or metadata
- `email` matching the auth.users email
