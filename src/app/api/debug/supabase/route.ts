import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Allow debug in production with explicit auth or during testing
    const { searchParams } = new URL(request.url);
    const debugAuth = searchParams.get('debug_auth');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY;

    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!supabaseUrl,
        isValid: supabaseUrl?.startsWith('https://') || false,
        preview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Missing'
      },
      NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!supabaseKey,
        isValid: (supabaseKey?.length || 0) > 100,
        preview: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Missing'
      }
    };

    // Test Supabase connection if keys are present
    let connectionTest = null;
    if (envCheck.NEXT_PUBLIC_SUPABASE_URL.exists && envCheck.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY.exists) {
      try {
        const supabase = createClient(supabaseUrl!, supabaseKey!);
        
        // Simple test query
        const { data, error } = await supabase
          .from('departments')
          .select('count')
          .limit(1);
        
        connectionTest = {
          success: !error,
          error: error?.message || null,
          errorCode: error?.code || null
        };
      } catch (testError: any) {
        connectionTest = {
          success: false,
          error: testError.message,
          errorCode: testError.code || 'UNKNOWN'
        };
      }
    }

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      environmentVariables: envCheck,
      connectionTest,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      details: error.message
    }, { status: 500 });
  }
}