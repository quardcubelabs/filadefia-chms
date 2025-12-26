import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Debug endpoint to check attendance data
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('=== DEBUG: Checking attendance data ===');

    // Check attendance table
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('date, attendance_type, event_id, present, recorded_by')
      .limit(20);

    // Check attendance_sessions table
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .limit(20);

    const result = {
      attendance_table: {
        error: attendanceError?.message || null,
        count: attendanceData?.length || 0,
        sample_records: attendanceData?.slice(0, 5) || []
      },
      attendance_sessions_table: {
        error: sessionsError?.message || null,
        count: sessionsData?.length || 0,
        sample_sessions: sessionsData?.slice(0, 5) || []
      }
    };

    console.log('Debug result:', result);

    return NextResponse.json({
      data: result
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}