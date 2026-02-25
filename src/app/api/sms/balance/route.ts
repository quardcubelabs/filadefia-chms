import { NextResponse } from 'next/server';
import { getSMSBalance } from '@/lib/nextsms';

/**
 * GET /api/sms/balance - Check NextSMS account balance
 */
export async function GET() {
  try {
    if (!process.env.NEXTSMS_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'SMS service not configured' },
        { status: 500 }
      );
    }

    const balance = await getSMSBalance();

    return NextResponse.json({
      success: true,
      data: balance,
    });
  } catch (error: any) {
    console.error('Error checking SMS balance:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check balance' },
      { status: 500 }
    );
  }
}
