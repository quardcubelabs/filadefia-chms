import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST - Create attendance_sessions table
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Creating attendance_sessions table...');

    // Create attendance_sessions table
    const { error: tableError } = await supabase.rpc('create_attendance_sessions_table', {});
    
    if (tableError) {
      console.error('RPC error, trying direct SQL:', tableError);
      
      // Fallback: try to execute the SQL directly
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS attendance_sessions (
          id SERIAL PRIMARY KEY,
          date DATE NOT NULL,
          attendance_type VARCHAR(50) NOT NULL,
          session_name VARCHAR(255),
          department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
          event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
          created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          total_members INTEGER DEFAULT 0,
          present_count INTEGER DEFAULT 0,
          absent_count INTEGER DEFAULT 0,
          attendance_rate DECIMAL(5,2) DEFAULT 0.00,
          
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
        CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON attendance_sessions(date);
        CREATE INDEX IF NOT EXISTS idx_attendance_sessions_type ON attendance_sessions(attendance_type);
        CREATE INDEX IF NOT EXISTS idx_attendance_sessions_qr_session_id ON attendance_sessions(qr_session_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_sessions_created_by ON attendance_sessions(created_by);
      `;
      
      const { error: directError } = await supabase.rpc('execute_sql', { sql: createTableSQL });
      
      if (directError) {
        console.error('Direct SQL error, trying simple approach:', directError);
        
        // Try the most basic approach
        const { error: basicError } = await supabase
          .from('attendance_sessions')
          .select('id')
          .limit(1);
          
        if (basicError && basicError.message.includes('does not exist')) {
          return NextResponse.json({ 
            error: 'Table does not exist and cannot be created via API. Please create the table manually using the schema file.',
            sql: createTableSQL
          }, { status: 500 });
        }
      }
    }

    // Try to verify table was created
    const { data: testData, error: testError } = await supabase
      .from('attendance_sessions')
      .select('id')
      .limit(1);

    if (testError) {
      return NextResponse.json({ 
        error: 'Table creation failed or table does not exist',
        details: testError.message 
      }, { status: 500 });
    }

    console.log('✓ attendance_sessions table is ready');

    return NextResponse.json({
      message: 'Database setup completed successfully',
      data: {
        table_exists: true,
        ready_for_migration: true
      }
    });

  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({ error: 'Internal server error during setup' }, { status: 500 });
  }
}