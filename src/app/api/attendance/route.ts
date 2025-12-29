import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST - Save attendance records
export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ 
        error: 'NEXT_PUBLIC_SUPABASE_URL is not configured' 
      }, { status: 500 });
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY is not configured' 
      }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );
    console.log('Attendance API called');
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { attendanceRecords, sessionInfo } = body;

    if (!attendanceRecords || !sessionInfo) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: attendanceRecords and sessionInfo' },
        { status: 400 }
      );
    }

    const { date, attendance_type, event_id, recorded_by } = sessionInfo;
    console.log('Session info:', { date, attendance_type, event_id, recorded_by });

    if (!date || !attendance_type) {
      return NextResponse.json(
        { error: 'Missing required session info: date and attendance_type' },
        { status: 400 }
      );
    }

    // Validate attendance records format
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return NextResponse.json(
        { error: 'attendanceRecords must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate each attendance record
    for (const record of attendanceRecords) {
      if (!record.member_id || typeof record.present !== 'boolean') {
        return NextResponse.json(
          { error: 'Each attendance record must have member_id and present fields' },
          { status: 400 }
        );
      }
    }

    // Prepare attendance data for insertion
    const attendanceData = attendanceRecords.map((record: any) => ({
      member_id: record.member_id,
      date: date,
      attendance_type: attendance_type,
      present: record.present,
      notes: record.notes || null,
      event_id: event_id || null,
      recorded_by: recorded_by || null
      // Remove created_at and updated_at - let database handle these
    }));

    // Check for existing attendance records for the same date and type
    const existingQuery = supabase
      .from('attendance')
      .select('member_id')
      .eq('date', date)
      .eq('attendance_type', attendance_type);

    if (event_id) {
      existingQuery.eq('event_id', event_id);
    }

    const { data: existingRecords, error: checkError } = await existingQuery;

    if (checkError) {
      console.error('Error checking existing records:', checkError);
      // If the table doesn't exist, that's ok - we'll create it on insert
      if (checkError.code !== 'PGRST116' && !checkError.message?.includes('relation') && !checkError.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Failed to check existing attendance records', details: checkError.message },
          { status: 500 }
        );
      }
      // Table doesn't exist, continue with insert (will create table structure)
      console.log('Attendance table may not exist yet, continuing with insert...');
    }

    // If there are existing records, delete them first to avoid duplicates
    if (existingRecords && existingRecords.length > 0) {
      const deleteQuery = supabase
        .from('attendance')
        .delete()
        .eq('date', date)
        .eq('attendance_type', attendance_type);

      if (event_id) {
        deleteQuery.eq('event_id', event_id);
      }

      const { error: deleteError } = await deleteQuery;

      if (deleteError) {
        console.error('Error deleting existing records:', deleteError);
        return NextResponse.json(
          { error: 'Failed to update existing attendance records' },
          { status: 500 }
        );
      }
    }

    // Insert new attendance records
    console.log('Inserting attendance data:', JSON.stringify(attendanceData.slice(0, 2), null, 2));
    
    const { data: insertedRecords, error: insertError } = await supabase
      .from('attendance')
      .insert(attendanceData)
      .select();

    if (insertError) {
      console.error('Error inserting attendance records:', insertError);
      console.error('Insert error details:', JSON.stringify(insertError, null, 2));
      return NextResponse.json(
        { error: `Failed to save attendance records: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Create or update session record in qr_attendance_sessions table
    try {
      const sessionId = `${date}_${attendance_type}_${event_id || 'regular'}`;
      const presentCount = attendanceData.filter(record => record.present).length;
      
      // Check if session already exists
      const { data: existingSession } = await supabase
        .from('qr_attendance_sessions')
        .select('id, check_ins')
        .eq('id', sessionId)
        .single();

      if (existingSession) {
        // Update existing session
        await supabase
          .from('qr_attendance_sessions')
          .update({
            check_ins: presentCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      } else {
        // Create new session
        await supabase
          .from('qr_attendance_sessions')
          .insert({
            id: sessionId,
            date: date,
            attendance_type: attendance_type,
            event_id: event_id || null,
            department_id: null, // Will be set based on department filter if needed
            session_name: `${attendance_type.replace('_', ' ')} - ${date}`,
            created_by: recorded_by,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
            is_active: true,
            check_ins: presentCount
          });
      }
    } catch (sessionError) {
      console.error('Error managing session record:', sessionError);
      // Don't fail the whole operation if session creation fails
    }

    return NextResponse.json({
      message: 'Attendance records saved successfully',
      data: {
        recordCount: insertedRecords?.length || 0,
        records: insertedRecords
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error');
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// GET - Fetch existing attendance records
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const type = searchParams.get('type');
    const eventId = searchParams.get('event_id');
    const memberId = searchParams.get('member_id');

    // If member_id is provided, we don't require date and type
    if (!memberId && (!date || !type)) {
      return NextResponse.json({ error: 'Either member_id or both date and type are required' }, { status: 400 });
    }

    console.log('Fetching attendance records for:', { date, type, eventId, memberId });

    // Build query
    let query = supabase
      .from('attendance')
      .select(`
        id,
        member_id,
        date,
        attendance_type,
        present,
        notes,
        event_id,
        recorded_by,
        created_at,
        members!inner(
          first_name,
          last_name,
          member_number
        )
      `);

    // Apply filters based on provided parameters
    if (memberId) {
      query = query.eq('member_id', memberId);
    }
    
    if (date) {
      query = query.eq('date', date);
    }
    
    if (type) {
      query = query.eq('attendance_type', type);
    }

    // Add event_id filter if provided
    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data: attendanceRecords, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attendance records:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Found ${attendanceRecords?.length || 0} attendance records`);

    return NextResponse.json({
      data: attendanceRecords || [],
      message: `Found ${attendanceRecords?.length || 0} attendance records`
    });

  } catch (error) {
    console.error('Error in GET attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}