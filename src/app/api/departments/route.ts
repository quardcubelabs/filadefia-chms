import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Departments API called at:', new Date().toISOString());
    console.log('Environment variables check:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('- SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('Missing NEXT_PUBLIC_SUPABASE_URL');
      return NextResponse.json({ 
        error: 'NEXT_PUBLIC_SUPABASE_URL is not configured' 
      }, { status: 500 });
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json({ 
        error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' 
      }, { status: 500 });
    }

    console.log('Creating Supabase client...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        db: {
          schema: 'public'
        }
      }
    );

    console.log('Attempting to query departments table...');
    let data = null;
    let error = null;

    // First try direct table access
    const directResult = await supabase
      .from('departments')
      .select('id, name, swahili_name')
      .eq('is_active', true)
      .order('name', { ascending: true });

    data = directResult.data;
    error = directResult.error;

    // If direct access fails due to RLS, try using RPC function
    if (error && (error.message.includes('policy') || error.code === 'PGRST301' || error.message.includes('JWT'))) {
      console.log('Direct access failed, trying RPC function...');
      const rpcResult = await supabase.rpc('get_departments');
      data = rpcResult.data;
      error = rpcResult.error;
    }

    if (error) {
      console.error('Supabase error details:');
      console.error('- Code:', error.code);
      console.error('- Message:', error.message);
      console.error('- Details:', error.details);
      console.error('- Hint:', error.hint);
      console.error('- Full error object:', JSON.stringify(error, null, 2));
      
      // If departments table doesn't exist, return empty array with explanation
      if (error.code === '42P01') {
        return NextResponse.json({ 
          data: [],
          message: 'Departments table not found. Please set up the departments in your database.'
        });
      }
      
      // If RPC function doesn't exist, that's expected - continue to default departments
      if (error.message.includes('get_departments') && error.message.includes('does not exist')) {
        console.log('RPC function not found, using default departments...');
        // Continue to default departments logic below
      } else {
        // If authentication/API key error, provide specific guidance  
        if (error.message.includes('Invalid API key') || error.message.includes('JWT') || error.code === 'PGRST301') {
          return NextResponse.json({ 
            error: 'Database access denied. This might be due to RLS policies or invalid API key.',
            details: error.message,
            suggestion: 'Run the fix_departments_rls.sql script in your database or check your SUPABASE_SERVICE_ROLE_KEY.'
          }, { status: 401 });
        }
        
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // If no departments found, return default departments for church structure
    if (!data || data.length === 0) {
      const defaultDepartments = [
        { id: 'default-1', name: 'General Assembly', swahili_name: 'Mkutano wa Jumla' },
        { id: 'default-2', name: 'Youth Department', swahili_name: 'Idara ya Vijana' },
        { id: 'default-3', name: 'Women Department', swahili_name: 'Idara ya Wanawake' },
        { id: 'default-4', name: 'Men Department', swahili_name: 'Idara ya Wanaume' },
        { id: 'default-5', name: 'Children Department', swahili_name: 'Idara ya Watoto' },
      ];
      
      return NextResponse.json({ 
        data: defaultDepartments,
        message: 'Using default departments. Please set up departments in your database for customization.'
      });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
