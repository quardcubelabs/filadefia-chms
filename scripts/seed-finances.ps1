# PowerShell script to seed the database with financial transaction data
# Run this from the project root directory

Write-Host "💰 Seeding database with financial transaction data..." -ForegroundColor Green

# Check if the SQL file exists
if (-not (Test-Path "database\seed_finances.sql")) {
    Write-Host "❌ Error: database\seed_finances.sql not found!" -ForegroundColor Red
    Write-Host "Please make sure you're running this from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "💾 Adding comprehensive financial transaction data to the database..." -ForegroundColor Blue

# Instructions for manual execution
Write-Host ""
Write-Host "🔧 To execute the financial seed script, you have several options:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Using Supabase Dashboard" -ForegroundColor Yellow
Write-Host "   1. Go to your Supabase project dashboard"
Write-Host "   2. Navigate to SQL Editor"
Write-Host "   3. Copy and paste the contents of database\seed_finances.sql"
Write-Host "   4. Click 'Run' to execute"
Write-Host ""
Write-Host "Option 2: Using Supabase CLI" -ForegroundColor Yellow
Write-Host "   supabase db reset --db-url 'your-connection-string'"
Write-Host ""
Write-Host "Option 3: Using psql command" -ForegroundColor Yellow
Write-Host "   psql 'your-connection-string' -f database\seed_finances.sql"
Write-Host ""

# Prompt user to continue
$continue = Read-Host "Press Enter to view the SQL file location, or 'q' to quit"
if ($continue -eq 'q') {
    exit 0
}

# Show file location
Write-Host "📁 SQL File Location: $(Get-Location)\database\seed_finances.sql" -ForegroundColor Green
Write-Host ""
Write-Host "📊 What this script will add:" -ForegroundColor Cyan
Write-Host "   💰 Comprehensive financial transaction history (2024-2025)"
Write-Host "   📈 All transaction types:"
Write-Host "     - Tithes (10% income offerings)"
Write-Host "     - Weekly service offerings" 
Write-Host "     - Special donations and projects"
Write-Host "     - Mission and outreach funding"
Write-Host "     - Welfare and community support"
Write-Host "     - Department-specific expenses"
Write-Host "     - Pledges and commitments"
Write-Host ""
Write-Host "   💳 Multiple payment methods:"
Write-Host "     - Cash transactions (60%)"
Write-Host "     - M-Pesa mobile money (25%)"
Write-Host "     - TigoPesa & Airtel Money (10%)"
Write-Host "     - Bank transfers & Cheques (5%)"
Write-Host ""
Write-Host "   🏢 Department coverage:"
Write-Host "     - Youth Department projects and events"
Write-Host "     - Women's Ministry activities"
Write-Host "     - Men's Fellowship initiatives"
Write-Host "     - Choir & Music equipment funding"
Write-Host "     - Evangelism & Mission outreach"
Write-Host "     - Children's Ministry resources"
Write-Host "     - Welfare & Counseling support"
Write-Host "     - Prayer & Intercession materials"
Write-Host "     - Media & Technical upgrades"
Write-Host "     - Discipleship & Teaching resources"
Write-Host ""
Write-Host "   📅 Timeline coverage:"
Write-Host "     - Complete 2024 financial year"
Write-Host "     - Current 2025 transactions"
Write-Host "     - Seasonal patterns (Easter, Christmas, etc.)"
Write-Host "     - Regular monthly and weekly patterns"
Write-Host ""
Write-Host "   💯 Data features:"
Write-Host "     - Realistic Tanzanian amounts (TZS 5,000 - 2,000,000)"
Write-Host "     - Mix of verified and unverified transactions"
Write-Host "     - Proper member and department associations"
Write-Host "     - Reference numbers for mobile money transactions"
Write-Host "     - Complete audit trail with recorded_by fields"
Write-Host ""
Write-Host "🎯 This will enable:" -ForegroundColor Green
Write-Host "   - Real-time dashboard financial statistics"
Write-Host "   - Dynamic weekly offerings chart with actual data"
Write-Host "   - Comprehensive financial reporting and analytics"
Write-Host "   - Transaction verification workflows"
Write-Host "   - Department-wise financial tracking"
Write-Host "   - Income vs expense analysis"
Write-Host "   - Member giving history and patterns"
Write-Host ""

Write-Host "📝 Total transactions to be added: 901 records" -ForegroundColor Magenta
Write-Host "💾 File ready for execution!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run the member seed script first (if not done): scripts\seed-members.ps1"
Write-Host "2. Execute the financial seed using one of the options above"
Write-Host "3. Verify the data in your dashboard and finance pages"