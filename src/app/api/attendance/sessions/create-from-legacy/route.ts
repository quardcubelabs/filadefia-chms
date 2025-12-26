import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { getSiteUrl } from '@/lib/config';

// POST - Create attendance session record from legacy attendance data
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { date, attendance_type, qr_duration_hours = 4 } = body;

    if (!date || !attendance_type) {
      return NextResponse.json({ error: 'Date and attendance type are required' }, { status: 400 });
    }

    console.log('Creating session from legacy data:', { date, attendance_type });

    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('attendance_sessions')
      .select('id')
      .eq('date', date)
      .eq('attendance_type', attendance_type)
      .single();

    if (existingSession) {
      return NextResponse.json({ error: 'Session already exists' }, { status: 400 });
    }

    // Get attendance data for this date and type
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('present, member_id, event_id, recorded_by')
      .eq('date', date)
      .eq('attendance_type', attendance_type);

    if (!attendanceData || attendanceData.length === 0) {
      return NextResponse.json({ error: 'No attendance data found for this session' }, { status: 404 });
    }

    // Calculate session stats
    const presentCount = attendanceData.filter(a => a.present).length;
    const totalCount = attendanceData.length;
    const attendanceRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

    // Get first recorded_by user and event_id
    const firstRecord = attendanceData[0];

    // Generate QR code for the session
    const qrSessionId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const baseUrl = getSiteUrl(request);
    const checkInUrl = `${baseUrl}/attendance/qr-checkin/${qrSessionId}`;
    
    // Calculate QR expiration time
    const qrExpiresAt = new Date();
    qrExpiresAt.setHours(qrExpiresAt.getHours() + qr_duration_hours);
    
    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Create session record
    const sessionData = {
      date,
      attendance_type,
      session_name: `${attendance_type.replace('_', ' ')} - ${date}`,
      department_id: null,
      event_id: firstRecord.event_id,
      created_by: firstRecord.recorded_by,
      total_members: totalCount,
      present_count: presentCount,
      absent_count: totalCount - presentCount,
      attendance_rate: attendanceRate,
      // QR code fields
      qr_code_data_url: qrCodeDataUrl,
      qr_session_id: qrSessionId,
      qr_check_in_url: checkInUrl,
      qr_expires_at: qrExpiresAt.toISOString(),
      qr_is_active: true,
      qr_check_ins: 0
    };

    const { data: createdSession, error: createError } = await supabase
      .from('attendance_sessions')
      .insert([sessionData])
      .select()
      .single();

    if (createError) {
      console.error('Error creating session:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: createdSession,
      message: 'Session created from legacy attendance data with QR code'
    });
  } catch (error) {
    console.error('Error creating session from legacy data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}