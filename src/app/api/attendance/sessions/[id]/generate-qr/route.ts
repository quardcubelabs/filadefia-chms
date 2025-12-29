import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { getSiteUrl } from '@/lib/config';

// POST - Generate QR code for existing attendance session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    const { id: sessionId } = await params;
    const body = await request.json();
    const { qr_duration_hours = 4 } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get existing session
    const { data: session, error: fetchError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Generate QR session ID and URLs
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

    // Update session with QR data
    const updateData = {
      qr_code_data_url: qrCodeDataUrl,
      qr_session_id: qrSessionId,
      qr_check_in_url: checkInUrl,
      qr_expires_at: qrExpiresAt.toISOString(),
      qr_is_active: true,
      qr_check_ins: 0
    };

    const { data: updatedSession, error: updateError } = await supabase
      .from('attendance_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating session with QR data:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: updatedSession,
      message: 'QR code generated successfully for existing session'
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}