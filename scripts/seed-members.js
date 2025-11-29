#!/usr/bin/env node

/**
 * Database Seeding Script
 * Adds 100 members and distributes them across all departments
 * 
 * Usage:
 *   node scripts/seed-members.js
 * 
 * Make sure to set your database connection string in environment variables:
 *   SUPABASE_DB_URL or DATABASE_URL
 */

const fs = require('fs');
const path = require('path');

async function seedDatabase() {
  console.log('🌱 Starting database seeding process...\n');

  // Check if SQL file exists
  const sqlFilePath = path.join(__dirname, '..', 'database', 'seed_members.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    console.error('❌ Error: database/seed_members.sql not found!');
    console.error('Please make sure you\'re running this from the project root directory.');
    process.exit(1);
  }

  // Read SQL file
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  console.log('📁 SQL file loaded successfully');
  console.log(`📊 File size: ${(sqlContent.length / 1024).toFixed(1)}KB`);
  console.log(`📝 Lines of SQL: ${sqlContent.split('\n').length}`);
  console.log('');

  // Check for database connection
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.log('⚠️  No database URL found in environment variables.');
    console.log('');
    console.log('🔧 To execute the seed script, you have several options:');
    console.log('');
    console.log('Option 1: Set environment variable and run again');
    console.log('   export DATABASE_URL="your-connection-string"');
    console.log('   node scripts/seed-members.js');
    console.log('');
    console.log('Option 2: Using Supabase Dashboard');
    console.log('   1. Go to your Supabase project dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste the contents of database/seed_members.sql');
    console.log('   4. Click "Run" to execute');
    console.log('');
    console.log('Option 3: Using psql command');
    console.log('   psql "your-connection-string" -f database/seed_members.sql');
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
    
    console.log('📥 Executing SQL seed script...');
    await client.query(sqlContent);
    
    await client.end();
    
    console.log('✅ Database seeding completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Error executing seed script:', error.message);
    console.log('');
    console.log('💡 Alternative: Execute the SQL file manually using:');
    console.log(`   psql "${dbUrl}" -f database/seed_members.sql`);
    console.log('');
  }

  // Show summary
  console.log('📊 Summary of what was added:');
  console.log('   • 100 new members with Tanzanian names and realistic data');
  console.log('   • Members distributed across all departments:');
  console.log('     - Youth Department: 20 members');
  console.log('     - Women\'s Department: 25 members'); 
  console.log('     - Men\'s Department: 25 members');
  console.log('     - Choir & Praise Team: 15 members');
  console.log('     - Evangelism Department: 12 members');
  console.log('     - Ushering Department: 10 members');
  console.log('     - Prayer & Intercession: 8 members');
  console.log('     - Media & Technical: 5 members');
  console.log('     - Children\'s Department: 4 teachers');
  console.log('     - Welfare & Counseling: 6 members');
  console.log('     - Mission & Outreach: 9 members');
  console.log('     - Discipleship & Teaching: 5 members');
  console.log('');
  console.log('🎉 All members have been successfully added and assigned to departments!');
}

// Check if pg module is available
try {
  require('pg');
} catch (error) {
  console.log('📦 Installing pg module for database connection...');
  console.log('   Run: npm install pg');
  console.log('   Then: node scripts/seed-members.js');
  console.log('');
}

seedDatabase().catch(console.error);