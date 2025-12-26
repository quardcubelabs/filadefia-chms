import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { getSiteUrl } from '@/lib/config';

// GET - Get available attendance sessions (grouped by date and type)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const attendanceType = searchParams.get('type');

    // First check for existing attendance_sessions (with QR data)
    let sessionQuery = supabase
      .from('attendance_sessions')
      .select('*')
      .order('date', { ascending: false });

    if (startDate) {
      sessionQuery = sessionQuery.gte('date', startDate);
    }
    if (endDate) {
      sessionQuery = sessionQuery.lte('date', endDate);
    }
    if (attendanceType) {
      sessionQuery = sessionQuery.eq('attendance_type', attendanceType);
    }

    const { data: sessionData } = await sessionQuery;

    // Also get attendance records for sessions without session records
    let query = supabase
      .from('attendance')
      .select('date, attendance_type, event_id, present')
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    if (attendanceType) {
      query = query.eq('attendance_type', attendanceType);
    }

    // Get sessions with counts
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by date and type for unique sessions
    const sessionsMap = new Map();
    
    // Start with existing session records (these include QR data)
    if (sessionData) {
      for (const session of sessionData) {
        const key = `${session.date}-${session.attendance_type}`;
        sessionsMap.set(key, {
          id: session.id,
          date: session.date,
          attendance_type: session.attendance_type,
          event_id: session.event_id,
          session_name: session.session_name,
          total_records: 0,
          present_count: 0,
          absent_count: 0,
          // QR related fields
          qr_code_data_url: session.qr_code_data_url,
          qr_session_id: session.qr_session_id,
          qr_check_in_url: session.qr_check_in_url,
          qr_expires_at: session.qr_expires_at,
          qr_is_active: session.qr_is_active && session.qr_expires_at ? new Date(session.qr_expires_at) > new Date() : false,
          qr_check_ins: session.qr_check_ins || 0,
          hasQRCode: !!session.qr_code_data_url
        });
      }
    }
    
    // Add sessions from attendance records that don't have session records
    if (data) {
      for (const record of data) {
        const key = `${record.date}-${record.attendance_type}`;
        if (!sessionsMap.has(key)) {
          sessionsMap.set(key, {
            id: null,
            date: record.date,
            attendance_type: record.attendance_type,
            event_id: record.event_id,
            session_name: null,
            total_records: 0,
            present_count: 0,
            absent_count: 0,
            // QR related fields (no QR code for old sessions)
            qr_code_data_url: null,
            qr_session_id: null,
            qr_check_in_url: null,
            qr_expires_at: null,
            qr_is_active: false,
            qr_check_ins: 0,
            hasQRCode: false
          });
        }
      }
    }

    // Get detailed counts for each session
    const sessions = Array.from(sessionsMap.values());
    
    // Get total active members for proper percentage calculation
    const { data: allMembers } = await supabase
      .from('members')
      .select('id')
      .eq('status', 'active');
    
    const totalActiveMembers = allMembers?.length || 0;
    
    for (const session of sessions) {
      const { data: sessionData } = await supabase
        .from('attendance')
        .select('present')
        .eq('date', session.date)
        .eq('attendance_type', session.attendance_type);

      if (sessionData) {
        session.total_records = sessionData.length;
        session.present_count = sessionData.filter(a => a.present).length;
        session.absent_count = sessionData.filter(a => !a.present).length;
        
        // Calculate attendance rate based on total active members instead of just recorded attendance
        session.attendance_rate = totalActiveMembers > 0 
          ? (session.present_count / totalActiveMembers) * 100 
          : 0;
        
        // Add total members count for display
        session.total_members = totalActiveMembers;
      }
    }

    // Sort by date descending
    sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ data: sessions });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new attendance session
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { 
      date, 
      attendance_type, 
      event_id, 
      department_id,
      auto_create_members = false,
      recorded_by,
      session_name,
      qr_duration_hours = 4
    } = body;

    if (!date || !attendance_type || !recorded_by) {
      return NextResponse.json({ 
        error: 'Date, attendance type, and recorded_by are required' 
      }, { status: 400 });
    }

    // Check if session already exists in attendance_sessions table
    const { data: existingSession } = await supabase
      .from('attendance_sessions')
      .select('id')
      .eq('date', date)
      .eq('attendance_type', attendance_type)
      .eq('department_id', department_id || null)
      .eq('event_id', event_id || null)
      .limit(1);

    if (existingSession && existingSession.length > 0) {
      return NextResponse.json({ 
        error: 'Attendance session already exists for this date and type' 
      }, { status: 400 });
    }

    // Also check attendance table for legacy sessions
    const { data: legacySession } = await supabase
      .from('attendance')
      .select('id')
      .eq('date', date)
      .eq('attendance_type', attendance_type)
      .limit(1);

    if (legacySession && legacySession.length > 0) {
      return NextResponse.json({ 
        error: 'Attendance session already exists for this date and type (legacy)' 
      }, { status: 400 });
    }

    // Get members to create attendance records for
    let membersQuery = supabase
      .from('members')
      .select('id, first_name, last_name, member_number')
      .eq('status', 'active');

    if (department_id) {
      // Get department members
      const { data: deptMembers } = await supabase
        .from('department_members')
        .select('member_id')
        .eq('department_id', department_id)
        .eq('is_active', true);

      const memberIds = deptMembers?.map(dm => dm.member_id) || [];
      if (memberIds.length > 0) {
        membersQuery = membersQuery.in('id', memberIds);
      } else {
        return NextResponse.json({ 
          error: 'No active members found in the specified department' 
        }, { status: 400 });
      }
    }

    const { data: members, error: membersError } = await membersQuery;

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ 
        error: 'No active members found' 
      }, { status: 400 });
    }

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

    // Create session record in attendance_sessions table
    const sessionData = {
      date,
      attendance_type,
      session_name: session_name || `${attendance_type.replace('_', ' ')} - ${date}`,
      department_id: department_id || null,
      event_id: event_id || null,
      created_by: recorded_by,
      total_members: members.length,
      present_count: 0,
      absent_count: auto_create_members ? members.length : 0,
      attendance_rate: 0,
      // QR code fields
      qr_code_data_url: qrCodeDataUrl,
      qr_session_id: qrSessionId,
      qr_check_in_url: checkInUrl,
      qr_expires_at: qrExpiresAt.toISOString(),
      qr_is_active: true,
      qr_check_ins: 0
    };

    const { data: sessionRecord, error: sessionError } = await supabase
      .from('attendance_sessions')
      .insert([sessionData])
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating attendance session:', sessionError);
      return NextResponse.json({ error: sessionError.message }, { status: 500 });
    }

    if (auto_create_members) {
      // Create attendance records for all members (marked as absent by default)
      const attendanceRecords = members.map(member => ({
        member_id: member.id,
        event_id: event_id || null,
        attendance_type,
        date,
        present: false, // Default to absent, will be updated during recording
        recorded_by
      }));

      const { data: createdRecords, error: insertError } = await supabase
        .from('attendance')
        .insert(attendanceRecords)
        .select('id');

      if (insertError) {
        console.error('Error creating attendance records:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      return NextResponse.json({ 
        data: {
          session: sessionRecord,
          members_count: members.length,
          records_created: createdRecords?.length || 0,
          qr_code_data_url: qrCodeDataUrl,
          qr_check_in_url: checkInUrl,
          qr_session_id: qrSessionId,
          qr_expires_at: qrExpiresAt.toISOString()
        },
        message: `Attendance session created with ${members.length} member records and QR code`
      });
    } else {
      // Just return session info and available members
      return NextResponse.json({ 
        data: {
          session: sessionRecord,
          available_members: members,
          members_count: members.length,
          qr_code_data_url: qrCodeDataUrl,
          qr_check_in_url: checkInUrl,
          qr_session_id: qrSessionId,
          qr_expires_at: qrExpiresAt.toISOString()
        },
        message: 'Attendance session ready for recording with QR code generated'
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}