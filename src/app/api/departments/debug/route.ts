import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEPARTMENTS DEBUG API ===');
    console.log('Environment variables check:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('- NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY);
    console.log('- URL preview:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
    console.log('- Key preview:', process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');
    
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

    console.log('Creating Supabase client...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    // Try to get table info first
    console.log('Checking if departments table exists...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'departments')
      .eq('table_schema', 'public');

    if (tableError) {
      console.error('Table check error:', tableError);
    } else {
      console.log('Table check result:', tableInfo);
    }

    // Try direct query
    console.log('Attempting direct departments query...');
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, swahili_name, is_active')
      .limit(5);

    console.log('Query result:');
    console.log('- Data:', data);
    console.log('- Error:', error);

    if (error) {
      console.error('Detailed error info:');
      console.error('- Code:', error.code);
      console.error('- Message:', error.message);
      console.error('- Details:', error.details);
      console.error('- Hint:', error.hint);

      return NextResponse.json({
        success: false,
        error: error.message,
        errorCode: error.code,
        errorDetails: error.details,
        hint: error.hint,
        suggestion: 'This is likely an RLS policy issue. Run the simple_rls_fix.sql script.',
        debugInfo: {
          tableExists: !!tableInfo && tableInfo.length > 0,
          environmentConfigured: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: data,
      count: data?.length || 0,
      debugInfo: {
        tableExists: true,
        environmentConfigured: true,
        message: 'Direct access successful!'
      }
    });

  } catch (error: any) {
    console.error('Unexpected error in departments debug:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}