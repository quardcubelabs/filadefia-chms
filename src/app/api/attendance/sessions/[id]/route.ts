import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Get specific attendance session by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    const sessionId = params.id;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get session from attendance_sessions table
    const { data: session, error } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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

// PUT - Update attendance session
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    const sessionId = params.id;
    const body = await request.json();
    const { action, qr_duration_hours } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    let updateData: any = {};

    switch (action) {
      case 'extend_qr':
        // Extend QR session expiration
        const newExpiry = new Date();
        newExpiry.setHours(newExpiry.getHours() + (qr_duration_hours || 2));
        updateData = { 
          qr_expires_at: newExpiry.toISOString(),
          qr_is_active: true
        };
        break;
      case 'close_qr':
        // Close QR session
        updateData = { qr_is_active: false };
        break;
      case 'activate_qr':
        // Reactivate QR session (if not expired)
        updateData = { qr_is_active: true };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('attendance_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      message: `Session ${action}d successfully`
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}