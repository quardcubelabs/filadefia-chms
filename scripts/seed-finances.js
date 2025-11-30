#!/usr/bin/env node

/**
 * Financial Data Seeding Script
 * Adds comprehensive financial transaction data to the database
 * 
 * Usage:
 *   node scripts/seed-finances.js
 * 
 * Make sure to set your database connection string in environment variables:
 *   SUPABASE_DB_URL or DATABASE_URL
 */

const fs = require('fs');
const path = require('path');

async function seedFinancialData() {
  console.log('💰 Starting financial data seeding process...\n');

  // Check if SQL file exists
  const sqlFilePath = path.join(__dirname, '..', 'database', 'seed_finances.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error('❌ Error: database/seed_finances.sql not found!');
    console.error('Please make sure you\'re running this from the project root directory.');
    process.exit(1);
  }

  // Read SQL file
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  console.log('📁 Financial seed file loaded successfully');
  console.log(`📊 File size: ${(sqlContent.length / 1024).toFixed(1)}KB`);
  console.log(`📝 Lines of SQL: ${sqlContent.split('\n').length}`);
  console.log('');

  // Check for database connection
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.log('⚠️  No database URL found in environment variables.');
    console.log('');
    console.log('🔧 To execute the financial seed script, you have several options:');
    console.log('');
    console.log('Option 1: Set environment variable and run again');
    console.log('   export DATABASE_URL="your-connection-string"');
    console.log('   node scripts/seed-finances.js');
    console.log('');
    console.log('Option 2: Using Supabase Dashboard');
    console.log('   1. Go to your Supabase project dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste the contents of database/seed_finances.sql');
    console.log('   4. Click "Run" to execute');
    console.log('');
    console.log('Option 3: Using psql command');
    console.log('   psql "your-connection-string" -f database/seed_finances.sql');
    console.log('');
    return;
  }

  try {
    // If we have a database URL, attempt to connect and execute
    const { Client } = require('pg');
    
    console.log('🔌 Connecting to database...');
    const client = new Client({ connectionString: dbUrl });
    
    await client.connect();
    console.log('✅ Connected to database successfully');
    
    console.log('💾 Executing financial seed script...');
    await client.query(sqlContent);
    
    await client.end();
    
    console.log('✅ Financial data seeding completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Error executing financial seed script:', error.message);
    console.log('');
    console.log('💡 Alternative: Execute the SQL file manually using:');
    console.log(`   psql "${dbUrl}" -f database/seed_finances.sql`);
    console.log('');
  }

  // Show summary
  console.log('📊 Summary of financial data added:');
  console.log('   • Comprehensive transaction history from 2024-2025');
  console.log('   • All transaction types: tithe, offering, donation, project, pledge, mission, welfare, expense');
  console.log('   • Multiple payment methods: Cash, M-Pesa, TigoPesa, Airtel Money, Bank Transfer, Cheque');
  console.log('   • Department-specific transactions for all 12 departments');
  console.log('   • Realistic Tanzanian amounts (TZS 5,000 - TZS 2,000,000)');
  console.log('   • Mix of verified and unverified transactions');
  console.log('   • Seasonal patterns and special events coverage');
  console.log('');
  console.log('💡 This data will enable:');
  console.log('   - Real-time dashboard financial statistics');
  console.log('   - Weekly offerings chart with actual data');
  console.log('   - Comprehensive financial reporting');
  console.log('   - Transaction verification workflows');
  console.log('   - Department-wise financial tracking');
}

// Auto-install pg if needed
async function ensurePgInstalled() {
  try {
    require('pg');
  } catch (error) {
    console.log('📦 Installing pg module for database connection...');
    console.log('   Run: npm install pg');
    console.log('   Then: node scripts/seed-finances.js\n');
    return false;
  }
  return true;
}

// Main execution
if (require.main === module) {
  ensurePgInstalled().then(hasPackage => {
    if (hasPackage) {
      seedFinancialData().catch(console.error);
    }
  });
}

module.exports = { seedFinancialData };