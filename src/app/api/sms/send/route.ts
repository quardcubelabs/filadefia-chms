import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBulkSMS, formatTanzanianPhone, isValidTanzanianPhone } from '@/lib/nextsms';

/**
 * POST /api/sms/send - Send bulk SMS via NextSMS
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key is configured
    if (!process.env.NEXTSMS_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'SMS service not configured. NEXTSMS_API_KEY is missing.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, recipientType, departmentId, memberIds, senderId } = body;

    // Validate required fields
    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!senderId) {
      return NextResponse.json(
        { success: false, error: 'Sender ID is required for audit purposes' },
        { status: 400 }
      );
    }

    if (message.trim().length > 918) {
      return NextResponse.json(
        { success: false, error: 'Message is too long. Maximum 918 characters (6 SMS segments).' },
        { status: 400 }
      );
    }

    // Initialize Supabase with service role
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get recipients based on type
    let recipients: { id: string; phone: string; name: string }[] = [];

    if (recipientType === 'all') {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, phone')
        .eq('status', 'active')
        .not('phone', 'is', null);

      if (error) throw error;
      recipients = (data || [])
        .filter(m => m.phone && m.phone.trim())
        .map(m => ({
          id: m.id,
          phone: m.phone,
          name: `${m.first_name} ${m.last_name}`,
        }));

    } else if (recipientType === 'department' && departmentId) {
      const { data: deptMembers, error: deptError } = await supabase
        .from('department_members')
        .select('member_id')
        .eq('department_id', departmentId)
        .eq('is_active', true);

      if (deptError) throw deptError;
      const memberIdList = (deptMembers || []).map(dm => dm.member_id);

      if (memberIdList.length > 0) {
        const { data, error } = await supabase
          .from('members')
          .select('id, first_name, last_name, phone')
          .in('id', memberIdList)
          .eq('status', 'active')
          .not('phone', 'is', null);

        if (error) throw error;
        recipients = (data || [])
          .filter(m => m.phone && m.phone.trim())
          .map(m => ({
            id: m.id,
            phone: m.phone,
            name: `${m.first_name} ${m.last_name}`,
          }));
      }

    } else if (recipientType === 'individual' && memberIds?.length > 0) {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, phone')
        .in('id', memberIds)
        .not('phone', 'is', null);

      if (error) throw error;
      recipients = (data || [])
        .filter(m => m.phone && m.phone.trim())
        .map(m => ({
          id: m.id,
          phone: m.phone,
          name: `${m.first_name} ${m.last_name}`,
        }));

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid recipient type or missing selection' },
        { status: 400 }
      );
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No recipients found with valid phone numbers' },
        { status: 400 }
      );
    }

    // Filter to only valid Tanzanian numbers
    const validRecipients = recipients.filter(r => isValidTanzanianPhone(r.phone));
    const invalidCount = recipients.length - validRecipients.length;

    if (validRecipients.length === 0) {
      return NextResponse.json(
        { success: false, error: `No valid Tanzanian phone numbers found. ${invalidCount} numbers were invalid.` },
        { status: 400 }
      );
    }

    // Send bulk SMS via NextSMS
    console.log(`[SMS API] Sending to ${validRecipients.length} recipients (${invalidCount} invalid skipped)`);
    
    const smsResult = await sendBulkSMS({
      recipients: validRecipients.map(r => ({ phone: r.phone, name: r.name })),
      message: message.trim(),
    });

    console.log(`[SMS API] Result: ${smsResult.totalSent} sent, ${smsResult.totalFailed} failed`);

    // If ALL messages failed, return the first error as the main error
    if (smsResult.totalSent === 0 && smsResult.totalFailed > 0) {
      const firstError = smsResult.results.find(r => !r.success)?.error || 'All messages failed';
      return NextResponse.json({
        success: false,
        error: `SMS delivery failed: ${firstError}`,
        data: {
          totalRecipients: validRecipients.length,
          totalSent: 0,
          totalFailed: smsResult.totalFailed,
          invalidNumbers: invalidCount,
          results: smsResult.results.slice(0, 10),
        }
      }, { status: 502 });
    }

    // Save communication record to database
    const communicationData = {
      recipient_ids: validRecipients.map(r => r.id),
      message: message.trim(),
      type: 'sms',
      subject: null,
      sent_by: senderId,
      delivery_status: smsResult.totalFailed === 0 ? 'delivered' : 
                       smsResult.totalSent === 0 ? 'failed' : 'sent',
      cost: smsResult.totalSent * 25, // ~25 TZS per SMS on NextSMS
    };

    await supabase
      .from('communications')
      .insert(communicationData);

    return NextResponse.json({
      success: true,
      data: {
        totalRecipients: validRecipients.length,
        totalSent: smsResult.totalSent,
        totalFailed: smsResult.totalFailed,
        invalidNumbers: invalidCount,
        balance: smsResult.balanceAfter,
        results: smsResult.results.slice(0, 20), // Limit results for response size
      },
    });

  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
