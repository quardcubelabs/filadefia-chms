import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST - QR Code Check-in
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await request.json();
    const { session_id, member_id, phone_number, member_number } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get session info
    let sessionData = null;
    try {
      const { data, error } = await supabase
        .from('qr_attendance_sessions')
        .select('*')
        .eq('id', session_id)
        .single();

      if (!error && data) {
        sessionData = data;
      }
    } catch (dbError) {
      console.log('QR sessions table access error');
    }

    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 404 });
    }

    // Check if session is active and not expired
    const now = new Date();
    const expiresAt = new Date(sessionData.expires_at);
    
    if (now > expiresAt || !sessionData.is_active) {
      return NextResponse.json({ error: 'Session has expired' }, { status: 410 });
    }

    // Find member by ID, phone, or member number
    let member = null;
    if (member_id) {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, member_number, phone, status')
        .eq('id', member_id)
        .eq('status', 'active')
        .single();
      
      if (!error && data) {
        member = data;
      }
    } else if (phone_number) {
      // Clean and format phone number for search
      const cleanPhone = phone_number.replace(/[\s\-\+]/g, '');
      
      // Try exact match first
      let { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, member_number, phone, status')
        .eq('phone', phone_number)
        .eq('status', 'active')
        .single();
      
      // If exact match fails, try with cleaned phone number
      if (error && cleanPhone !== phone_number) {
        const result = await supabase
          .from('members')
          .select('id, first_name, last_name, member_number, phone, status')
          .eq('phone', cleanPhone)
          .eq('status', 'active')
          .single();
        
        data = result.data;
        error = result.error;
      }
      
      // If still not found, try partial matching (last 9 digits for Tanzanian numbers)
      if (error && cleanPhone.length >= 9) {
        const lastNineDigits = cleanPhone.slice(-9);
        const result = await supabase
          .from('members')
          .select('id, first_name, last_name, member_number, phone, status')
          .ilike('phone', `%${lastNineDigits}`)
          .eq('status', 'active')
          .limit(1);
        
        if (result.data && result.data.length > 0) {
          data = result.data[0];
          error = null;
        }
      }
      
      if (!error && data) {
        member = data;
      }
    } else if (member_number) {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, member_number, phone, status')
        .eq('member_number', member_number)
        .eq('status', 'active')
        .single();
      
      if (!error && data) {
        member = data;
      }
    }

    if (!member) {
      console.log('Member lookup failed:', { member_id, phone_number, member_number });
      
      // Provide more specific error messages
      let errorMessage = 'Member not found or inactive.';
      if (phone_number) {
        errorMessage += ` Phone number: ${phone_number}`;
      } else if (member_number) {
        errorMessage += ` Member number: ${member_number}`;
      }
      errorMessage += ' Please contact church administration.';
      
      return NextResponse.json({ 
        error: errorMessage,
        debug: {
          searchCriteria: { member_id, phone_number, member_number },
          suggestion: 'Check if the member is registered and active in the system'
        }
      }, { status: 404 });
    }

    // Check if member already checked in for this session
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('id, present')
      .eq('member_id', member.id)
      .eq('date', sessionData.date)
      .eq('attendance_type', sessionData.attendance_type)
      .single();

    if (existingAttendance) {
      if (existingAttendance.present) {
        return NextResponse.json({
          data: {
            member,
            attendance_id: existingAttendance.id,
            already_present: true
          },
          message: `Welcome back! ${member.first_name} ${member.last_name} was already marked present.`
        });
      } else {
        // Update existing record to present
        const { data: updatedAttendance, error: updateError } = await supabase
          .from('attendance')
          .update({ 
            present: true,
            notes: 'Checked in via QR code',
            recorded_by: null // Set to null to avoid foreign key issues
          })
          .eq('id', existingAttendance.id)
          .select()
          .single();

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({
          data: {
            member,
            attendance_id: updatedAttendance.id,
            checked_in_at: new Date().toISOString()
          },
          message: `Welcome! ${member.first_name} ${member.last_name} has been marked present.`
        });
      }
    } else {
      // Create new attendance record
      const { data: newAttendance, error: createError } = await supabase
        .from('attendance')
        .insert([{
          member_id: member.id,
          event_id: sessionData.event_id,
          attendance_type: sessionData.attendance_type,
          date: sessionData.date,
          present: true,
          notes: 'Checked in via QR code',
          recorded_by: null // Set to null to avoid foreign key issues
        }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating attendance record:', createError);
        console.error('Attempted to insert:', {
          member_id: member.id,
          event_id: sessionData.event_id,
          attendance_type: sessionData.attendance_type,
          date: sessionData.date,
          present: true,
          notes: 'Checked in via QR code',
          recorded_by: null
        });
        return NextResponse.json({ 
          error: createError.message,
          details: createError.details,
          hint: createError.hint 
        }, { status: 500 });
      }

      // Update session check-in count
      try {
        await supabase
          .from('qr_attendance_sessions')
          .update({ 
            check_ins: (sessionData.check_ins || 0) + 1 
          })
          .eq('id', session_id);
      } catch (updateError) {
        console.log('Error updating session count:', updateError);
      }

      return NextResponse.json({
        data: {
          member,
          attendance_id: newAttendance.id,
          checked_in_at: newAttendance.created_at
        },
        message: `Welcome! ${member.first_name} ${member.last_name} has been checked in successfully.`
      });
    }
  } catch (error) {
    console.error('Error processing QR check-in:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get check-in statistics for a session
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get session info
    const { data: sessionData } = await supabase
      .from('qr_attendance_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get attendance records for this session
    const { data: attendanceRecords } = await supabase
      .from('attendance')
      .select(`
        id,
        member_id,
        present,
        created_at,
        notes,
        members!inner(
          first_name,
          last_name,
          member_number,
          photo_url
        )
      `)
      .eq('date', sessionData.date)
      .eq('attendance_type', sessionData.attendance_type)
      .eq('present', true)
      .order('created_at', { ascending: false });

    const checkedInMembers = attendanceRecords || [];
    const qrCheckins = checkedInMembers.filter(record => 
      record.notes && record.notes.includes('QR code')
    );

    return NextResponse.json({
      data: {
        session: sessionData,
        total_checkins: checkedInMembers.length,
        qr_checkins: qrCheckins.length,
        manual_checkins: checkedInMembers.length - qrCheckins.length,
        recent_checkins: checkedInMembers.slice(0, 10), // Last 10 check-ins
        session_status: sessionData.is_active && new Date() < new Date(sessionData.expires_at) ? 'active' : 'expired'
      }
    });
  } catch (error) {
    console.error('Error getting check-in stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}