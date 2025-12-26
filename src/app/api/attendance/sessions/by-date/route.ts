import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Get attendance session by date and type
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const type = searchParams.get('type');

    if (!date || !type) {
      return NextResponse.json({ error: 'Date and type are required' }, { status: 400 });
    }

    console.log('Looking for session:', { date, type });

    // Get session from attendance_sessions table
    const { data: session, error } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('date', date)
      .eq('attendance_type', type)
      .single();

    if (error) {
      console.error('Error fetching session by date/type:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if QR session is active (not expired)
    const isQRActive = session.qr_is_active && 
                       session.qr_expires_at && 
                       new Date(session.qr_expires_at) > new Date();

    // Get attendance count for this session
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('present')
      .eq('date', session.date)
      .eq('attendance_type', session.attendance_type);

    const presentCount = attendanceData?.filter(a => a.present).length || 0;
    const totalCount = attendanceData?.length || session.total_members;

    const sessionWithCounts = {
      ...session,
      present_count: presentCount,
      total_count: totalCount,
      attendance_rate: totalCount > 0 ? (presentCount / totalCount) * 100 : 0,
      qr_is_active: isQRActive,
      hasQRCode: !!session.qr_code_data_url
    };

    return NextResponse.json({
      data: sessionWithCounts
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}