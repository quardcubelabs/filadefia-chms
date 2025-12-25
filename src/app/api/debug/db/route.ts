import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test basic connection
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(10);

    if (tablesError) {
      return NextResponse.json({
        success: false,
        error: tablesError.message,
        code: tablesError.code
      }, { status: 500 });
    }

    // Check if attendance table exists
    const attendanceTableExists = tables?.some(t => t.table_name === 'attendance');

    // Try a simple query on attendance table
    let attendanceTest = null;
    if (attendanceTableExists) {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('count(*)')
        .limit(1);
      
      attendanceTest = {
        error: attendanceError?.message || null,
        hasData: !!attendanceData
      };
    }

    return NextResponse.json({
      success: true,
      tables: tables?.map(t => t.table_name) || [],
      attendanceTableExists,
      attendanceTest
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}