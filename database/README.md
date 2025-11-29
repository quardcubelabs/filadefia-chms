# Member Database Seeding

This directory contains scripts to populate your church management system with 100 sample members distributed across all departments.

## 📊 What Gets Added

- **100 Members** with realistic Tanzanian names and contact information
- **Department Distribution:**
  - Youth Department: 20 members
  - Women's Department: 25 members
  - Men's Department: 25 members
  - Choir & Praise Team: 15 members
  - Evangelism Department: 12 members
  - Ushering Department: 10 members
  - Prayer & Intercession: 8 members
  - Media & Technical: 5 members
  - Children's Department: 4 teachers
  - Welfare & Counseling: 6 members
  - Mission & Outreach: 9 members
  - Discipleship & Teaching: 5 members

## 🚀 How to Run

### Method 1: Using npm scripts (Recommended)

```bash
# Install pg dependency first (if not already installed)
npm install pg

# Run the seeding script
npm run seed:members
```

### Method 2: Using PowerShell (Windows)

```powershell
# Run the PowerShell script
npm run seed:members:win
# OR directly
powershell -ExecutionPolicy Bypass -File scripts/seed-members.ps1
```

### Method 3: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `database/seed_members.sql`
4. Copy and paste the entire content
5. Click **"Run"** to execute

### Method 4: Using psql command line

```bash
# Replace with your actual connection string
psql "postgresql://username:password@host:port/database" -f database/seed_members.sql
```

### Method 5: Using Supabase CLI

```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Reset database with seed data
supabase db reset --file database/seed_members.sql
```

## 🔧 Environment Setup

For automated execution, set your database connection string:

```bash
# Option 1: Supabase URL
export SUPABASE_DB_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Option 2: Generic PostgreSQL URL
export DATABASE_URL="postgresql://username:password@host:port/database"
```

## 📁 Files Included

- `seed_members.sql` - Main SQL script with all member data
- `seed-members.js` - Node.js script for automated execution
- `seed-members.ps1` - PowerShell script for Windows users
- `seed-members.sh` - Bash script for Unix/Linux users

## ⚠️ Important Notes

1. **Backup First**: Always backup your database before running seed scripts
2. **Run Once**: This script should only be run once to avoid duplicate members
3. **Department Prerequisites**: Ensure all departments exist before running (they should be created by the main schema)
4. **Member Numbers**: The script uses member numbers FCC001 to FCC100

## 🎯 Sample Data Features

- **Realistic Names**: All members have authentic Tanzanian names
- **Varied Demographics**: Mix of ages, occupations, and marital statuses
- **Complete Contact Info**: Phone numbers, emails, and addresses
- **Baptism & Membership Dates**: Realistic date ranges
- **Department Leadership**: Automatic assignment of leadership roles
- **Cross-Department Participation**: Some members belong to multiple departments

## 🔍 Verification

After running the script, verify the data was inserted correctly:

```sql
-- Check member count
SELECT COUNT(*) as total_members FROM members;

-- Check department distribution
SELECT d.name, COUNT(dm.member_id) as member_count 
FROM departments d 
LEFT JOIN department_members dm ON d.id = dm.department_id 
GROUP BY d.name 
ORDER BY member_count DESC;

-- Check member details
SELECT member_number, first_name, last_name, status 
FROM members 
WHERE member_number LIKE 'FCC%' 
ORDER BY member_number 
LIMIT 10;
```

## 🎉 Success!

Once completed, your church management system will have a robust dataset to test and demonstrate all features including:

- Member management and profiles
- Department organization and leadership
- Reports and analytics
- Communication systems
- Financial tracking (ready for transaction data)
- Event management (ready for event registrations)

Happy church management! 🙏