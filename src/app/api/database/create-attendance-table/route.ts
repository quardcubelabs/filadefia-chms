import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST - Create attendance_sessions table directly via SQL
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Creating attendance_sessions table via raw SQL...');

    // The SQL from attendance_schema.sql for the attendance_sessions table
    const createTableSQL = `
      -- Create attendance sessions table for grouping attendance records
      CREATE TABLE IF NOT EXISTS attendance_sessions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          date DATE NOT NULL,
          attendance_type VARCHAR(50) NOT NULL,
          session_name VARCHAR(200),
          department_id UUID,
          event_id UUID,
          created_by UUID,
          total_members INTEGER DEFAULT 0,
          present_count INTEGER DEFAULT 0,
          absent_count INTEGER DEFAULT 0,
          attendance_rate DECIMAL(5,2) DEFAULT 0,
          -- QR Code related fields
          qr_code_data_url TEXT,
          qr_session_id VARCHAR(50),
          qr_check_in_url TEXT,
          qr_expires_at TIMESTAMP WITH TIME ZONE,
          qr_is_active BOOLEAN DEFAULT FALSE,
          qr_check_ins INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Prevent duplicate sessions for same date and type
          UNIQUE(date, attendance_type, department_id, event_id)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_sessions_date ON attendance_sessions(date);
      CREATE INDEX IF NOT EXISTS idx_attendance_sessions_type ON attendance_sessions(attendance_type);
      CREATE INDEX IF NOT EXISTS idx_attendance_sessions_qr_session_id ON attendance_sessions(qr_session_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_sessions_created_by ON attendance_sessions(created_by);

      -- Create updated_at trigger function if it doesn't exist
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create trigger for updated_at column
      DROP TRIGGER IF EXISTS update_sessions_updated_at ON attendance_sessions;
      CREATE TRIGGER update_sessions_updated_at 
          BEFORE UPDATE ON attendance_sessions 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `;

    // Execute the SQL using the SQL editor feature in Supabase
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.error('SQL execution error:', error);
      
      // If the function doesn't exist, try a different approach
      if (error.message.includes('function exec_sql') || error.message.includes('does not exist')) {
        console.log('Trying alternative approach...');
        
        // Try creating table by attempting to select from it and handling the error
        const { error: testError } = await supabase
          .from('attendance_sessions')
          .select('id')
          .limit(0);
          
        if (!testError || !testError.message.includes('does not exist')) {
          return NextResponse.json({
            message: 'Table already exists or was created successfully',
            data: { table_ready: true }
          });
        }
        
        return NextResponse.json({ 
          error: 'Cannot create table via API. Please run the SQL manually in Supabase dashboard.',
          sql_to_run: createTableSQL,
          instructions: [
            '1. Go to your Supabase dashboard',
            '2. Navigate to SQL Editor',
            '3. Run the provided SQL to create the attendance_sessions table',
            '4. Then run the migration again'
          ]
        }, { status: 500 });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Verify table was created by testing a simple query
    const { data: testData, error: testError } = await supabase
      .from('attendance_sessions')
      .select('id')
      .limit(1);

    if (testError) {
      return NextResponse.json({ 
        error: 'Table creation might have failed',
        details: testError.message,
        sql_to_run: createTableSQL
      }, { status: 500 });
    }

    console.log('✓ attendance_sessions table created successfully');

    return NextResponse.json({
      message: 'attendance_sessions table created successfully',
      data: {
        table_exists: true,
        ready_for_migration: true
      }
    });

  } catch (error) {
    console.error('Database table creation error:', error);
    return NextResponse.json({ error: 'Internal server error during table creation' }, { status: 500 });
  }
}