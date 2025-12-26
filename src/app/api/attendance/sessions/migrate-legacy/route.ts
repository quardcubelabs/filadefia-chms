import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { getSiteUrl } from '@/lib/config';

// POST - Migrate legacy attendance data to attendance_sessions table with QR codes
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('Starting legacy attendance migration...');

    // Get all unique attendance sessions from attendance table
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select('date, attendance_type, event_id, present, recorded_by')
      .order('date', { ascending: false });

    if (attendanceError) {
      console.error('Error fetching attendance data:', attendanceError);
      return NextResponse.json({ error: attendanceError.message }, { status: 500 });
    }

    if (!attendanceData || attendanceData.length === 0) {
      return NextResponse.json({ message: 'No attendance data found to migrate' });
    }

    // Group attendance by date and type to create sessions
    const sessionsMap = new Map();
    
    for (const record of attendanceData) {
      const key = `${record.date}-${record.attendance_type}`;
      if (!sessionsMap.has(key)) {
        sessionsMap.set(key, {
          date: record.date,
          attendance_type: record.attendance_type,
          event_id: record.event_id,
          recorded_by: record.recorded_by,
          attendanceRecords: []
        });
      }
      sessionsMap.get(key).attendanceRecords.push(record);
    }

    console.log(`Found ${sessionsMap.size} unique sessions to migrate`);

    // Get existing sessions to avoid duplicates
    const { data: existingSessions } = await supabase
      .from('attendance_sessions')
      .select('date, attendance_type');

    const existingKeys = new Set();
    if (existingSessions) {
      for (const session of existingSessions) {
        existingKeys.add(`${session.date}-${session.attendance_type}`);
      }
    }

    console.log(`Found ${existingKeys.size} existing sessions`);

    const migratedSessions = [];
    const baseUrl = getSiteUrl(request);

    // Process each unique session
    for (const [key, sessionData] of sessionsMap.entries()) {
      // Skip if session already exists
      if (existingKeys.has(key)) {
        console.log(`Skipping existing session: ${key}`);
        continue;
      }

      console.log(`Processing session: ${key}`);

      const { date, attendance_type, event_id, recorded_by, attendanceRecords } = sessionData;

      // Calculate session stats
      const presentCount = attendanceRecords.filter((a: any) => a.present).length;
      const totalCount = attendanceRecords.length;
      const attendanceRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

      // Generate QR code for the session
      const qrSessionId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const checkInUrl = `${baseUrl}/attendance/qr-checkin/${qrSessionId}`;
      
      // Set QR expiration to 4 hours from now (they can be extended later)
      const qrExpiresAt = new Date();
      qrExpiresAt.setHours(qrExpiresAt.getHours() + 4);
      
      try {
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
        const sessionRecord = {
          date,
          attendance_type,
          session_name: `${attendance_type.replace(/_/g, ' ')} - ${date}`,
          department_id: null,
          event_id: event_id,
          created_by: recorded_by,
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
          .insert([sessionRecord])
          .select()
          .single();

        if (createError) {
          console.error(`Error creating session ${key}:`, createError);
          continue;
        }

        migratedSessions.push(createdSession);
        console.log(`✓ Migrated session: ${key} with ${presentCount}/${totalCount} attendance`);

        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (qrError) {
        console.error(`Error generating QR for session ${key}:`, qrError);
        continue;
      }
    }

    console.log(`Migration completed. Created ${migratedSessions.length} sessions`);

    return NextResponse.json({
      message: `Successfully migrated ${migratedSessions.length} attendance sessions with QR codes`,
      data: {
        total_found: sessionsMap.size,
        existing_sessions: existingKeys.size,
        migrated_sessions: migratedSessions.length,
        sessions: migratedSessions.map(s => ({
          id: s.id,
          date: s.date,
          attendance_type: s.attendance_type,
          present_count: s.present_count,
          total_members: s.total_members,
          attendance_rate: s.attendance_rate,
          has_qr_code: !!s.qr_code_data_url
        }))
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Internal server error during migration' }, { status: 500 });
  }
}