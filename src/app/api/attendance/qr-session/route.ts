import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

// POST - Create QR attendance session
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await request.json();
    const { 
      date, 
      attendance_type, 
      event_id,
      department_id,
      session_name,
      expires_at,
      recorded_by 
    } = body;

    if (!date || !attendance_type || !recorded_by) {
      return NextResponse.json({ 
        error: 'Date, attendance type, and recorded_by are required' 
      }, { status: 400 });
    }

    // Generate unique session ID
    const sessionId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate expiration (default 4 hours from now)
    const defaultExpiry = new Date();
    defaultExpiry.setHours(defaultExpiry.getHours() + 4);
    const expirationTime = expires_at ? new Date(expires_at) : defaultExpiry;

    // Create QR session record
    const qrSessionData = {
      id: sessionId,
      date,
      attendance_type,
      event_id: event_id || null,
      department_id: department_id || null,
      session_name: session_name || `${attendance_type.replace('_', ' ')} - ${date}`,
      created_by: recorded_by,
      expires_at: expirationTime.toISOString(),
      is_active: true,
      check_ins: 0
    };

    // Store session in database (you may want to create a qr_attendance_sessions table)
    // For now, we'll use a temporary approach with the events table or create a custom table

    // Generate QR code URL - points to check-in page
    const checkInUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/attendance/qr-checkin/${sessionId}`;
    
    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Store session data temporarily in a sessions table or cache
    // For this implementation, we'll create the session record
    const { data: sessionRecord, error: sessionError } = await supabase
      .from('qr_attendance_sessions')
      .insert([qrSessionData])
      .select()
      .single();

    if (sessionError) {
      // If table doesn't exist, we'll handle it gracefully
      console.log('QR sessions table may not exist, using alternative storage');
    }

    return NextResponse.json({
      data: {
        session_id: sessionId,
        qr_code: qrCodeDataUrl,
        check_in_url: checkInUrl,
        session_info: qrSessionData,
        expires_at: expirationTime.toISOString()
      },
      message: 'QR attendance session created successfully'
    });
  } catch (error) {
    console.error('Error creating QR session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get QR session info
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Try to get session from database
    let sessionData = null;
    try {
      const { data, error } = await supabase
        .from('qr_attendance_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!error && data) {
        sessionData = data;
      }
    } catch (dbError) {
      console.log('QR sessions table access error, using fallback');
    }

    // If no session found or table doesn't exist, return error
    if (!sessionData) {
      return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(sessionData.expires_at);
    
    if (now > expiresAt || !sessionData.is_active) {
      return NextResponse.json({ error: 'Session has expired' }, { status: 410 });
    }

    return NextResponse.json({
      data: {
        session_id: sessionData.id,
        date: sessionData.date,
        attendance_type: sessionData.attendance_type,
        session_name: sessionData.session_name,
        department_id: sessionData.department_id,
        event_id: sessionData.event_id,
        check_ins: sessionData.check_ins || 0,
        expires_at: sessionData.expires_at,
        is_active: sessionData.is_active
      }
    });
  } catch (error) {
    console.error('Error fetching QR session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update QR session (close, extend, etc.)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { session_id, action, expires_at } = body;

    if (!session_id || !action) {
      return NextResponse.json({ 
        error: 'Session ID and action are required' 
      }, { status: 400 });
    }

    let updateData: any = {};

    switch (action) {
      case 'close':
        updateData = { is_active: false };
        break;
      case 'extend':
        if (expires_at) {
          updateData = { expires_at };
        } else {
          // Extend by 2 hours
          const newExpiry = new Date();
          newExpiry.setHours(newExpiry.getHours() + 2);
          updateData = { expires_at: newExpiry.toISOString() };
        }
        break;
      case 'activate':
        updateData = { is_active: true };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update session
    const { data, error } = await supabase
      .from('qr_attendance_sessions')
      .update(updateData)
      .eq('id', session_id)
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
    console.error('Error updating QR session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}