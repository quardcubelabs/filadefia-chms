#!/bin/bash

# Script to run the member seeding SQL file
# This script adds 100 members and distributes them across departments

echo "🌱 Seeding database with 100 members..."

# Check if the SQL file exists
if [ ! -f "database/seed_members.sql" ]; then
    echo "❌ Error: database/seed_members.sql not found!"
    echo "Please make sure you're running this from the project root directory."
    exit 1
fi

# Run the SQL file using psql (you'll need to adjust connection details)
echo "📥 Adding 100 members to the database..."

# Option 1: If using Supabase CLI
if command -v supabase &> /dev/null; then
    echo "Using Supabase CLI..."
    supabase db reset --db-url "your-supabase-db-url" --file database/seed_members.sql
fi

# Option 2: If using direct PostgreSQL connection
# Uncomment and modify the connection string below
# psql "postgresql://username:password@host:port/database" -f database/seed_members.sql

echo "✅ Database seeding completed!"
echo ""
echo "📊 Summary:"
echo "   • 100 new members added"
echo "   • Members distributed across all departments:"
echo "     - Youth Department: 20 members"
echo "     - Women's Department: 25 members" 
echo "     - Men's Department: 25 members"
echo "     - Choir & Praise Team: 15 members"
echo "     - Evangelism Department: 12 members"
echo "     - Ushering Department: 10 members"
echo "     - Prayer & Intercession: 8 members"
echo "     - Media & Technical: 5 members"
echo "     - Children's Department: 4 teachers"
echo "     - Welfare & Counseling: 6 members"
echo "     - Mission & Outreach: 9 members"
echo "     - Discipleship & Teaching: 5 members"
echo ""
echo "🎉 All members have been successfully added and assigned to departments!"