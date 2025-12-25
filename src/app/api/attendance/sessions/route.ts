import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Build query for distinct sessions
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
    
    if (data) {
      for (const record of data) {
        const key = `${record.date}-${record.attendance_type}`;
        if (!sessionsMap.has(key)) {
          sessionsMap.set(key, {
            date: record.date,
            attendance_type: record.attendance_type,
            event_id: record.event_id,
            total_records: 0,
            present_count: 0,
            absent_count: 0
          });
        }
      }
    }

    // Get detailed counts for each session
    const sessions = Array.from(sessionsMap.values());
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
        session.attendance_rate = session.total_records > 0 
          ? (session.present_count / session.total_records) * 100 
          : 0;
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
      recorded_by
    } = body;

    if (!date || !attendance_type || !recorded_by) {
      return NextResponse.json({ 
        error: 'Date, attendance type, and recorded_by are required' 
      }, { status: 400 });
    }

    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('attendance')
      .select('id')
      .eq('date', date)
      .eq('attendance_type', attendance_type)
      .limit(1);

    if (existingSession && existingSession.length > 0) {
      return NextResponse.json({ 
        error: 'Attendance session already exists for this date and type' 
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
          session: { date, attendance_type, event_id, department_id },
          members_count: members.length,
          records_created: createdRecords?.length || 0
        },
        message: `Attendance session created with ${members.length} member records`
      });
    } else {
      // Just return session info and available members
      return NextResponse.json({ 
        data: {
          session: { date, attendance_type, event_id, department_id },
          available_members: members,
          members_count: members.length
        },
        message: 'Attendance session ready for recording'
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}