import { NextRequest, NextResponse } from 'next/server';

// This is a simple endpoint to trigger the migration
export async function GET(request: NextRequest) {
  try {
    const baseUrl = request.url.replace('/api/test/migrate-sessions', '');
    
    const response = await fetch(`${baseUrl}/api/attendance/sessions/migrate-legacy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Migration completed successfully',
        data: result
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Migration trigger error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to trigger migration'
    }, { status: 500 });
  }
}