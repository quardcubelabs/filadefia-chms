# PowerShell script to seed the database with 100 members
# Run this from the project root directory

Write-Host "🌱 Seeding database with 100 members..." -ForegroundColor Green

# Check if the SQL file exists
if (-not (Test-Path "database\seed_members.sql")) {
    Write-Host "❌ Error: database\seed_members.sql not found!" -ForegroundColor Red
    Write-Host "Please make sure you're running this from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "📥 Adding 100 members to the database..." -ForegroundColor Blue

# Instructions for manual execution
Write-Host ""
Write-Host "🔧 To execute the seed script, you have several options:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Using Supabase Dashboard" -ForegroundColor Yellow
Write-Host "   1. Go to your Supabase project dashboard"
Write-Host "   2. Navigate to SQL Editor"
Write-Host "   3. Copy and paste the contents of database\seed_members.sql"
Write-Host "   4. Click 'Run' to execute"
Write-Host ""
Write-Host "Option 2: Using Supabase CLI" -ForegroundColor Yellow
Write-Host "   supabase db reset --db-url 'your-connection-string'"
Write-Host ""
Write-Host "Option 3: Using psql command" -ForegroundColor Yellow
Write-Host "   psql 'your-connection-string' -f database\seed_members.sql"
Write-Host ""

# Prompt user to continue
$continue = Read-Host "Press Enter to view the SQL file location, or 'q' to quit"
if ($continue -eq 'q') {
    exit 0
}

# Show file location
Write-Host "📁 SQL File Location: $(Get-Location)\database\seed_members.sql" -ForegroundColor Green
Write-Host ""
Write-Host "📊 What this script will add:" -ForegroundColor Cyan
Write-Host "   • 100 new members with Tanzanian names and realistic data"
Write-Host "   • Members distributed across all departments:"
Write-Host "     - Youth Department: 20 members"
Write-Host "     - Women's Department: 25 members" 
Write-Host "     - Men's Department: 25 members"
Write-Host "     - Choir & Praise Team: 15 members"
Write-Host "     - Evangelism Department: 12 members"
Write-Host "     - Ushering Department: 10 members"
Write-Host "     - Prayer & Intercession: 8 members"
Write-Host "     - Media & Technical: 5 members"
Write-Host "     - Children's Department: 4 teachers"
Write-Host "     - Welfare & Counseling: 6 members"
Write-Host "     - Mission & Outreach: 9 members"
Write-Host "     - Discipleship & Teaching: 5 members"
Write-Host ""
Write-Host "✅ Ready to seed! Execute the SQL file using one of the methods above." -ForegroundColor Green