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
        }
      }
    );

    console.log('Attempting to query departments table...');
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, swahili_name')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error details:');
      console.error('- Code:', error.code);
      console.error('- Message:', error.message);
      console.error('- Details:', error.details);
      console.error('- Hint:', error.hint);
      
      // If departments table doesn't exist, return default departments
      if (error.code === '42P01') {
        console.log('Departments table not found, using default departments...');
        // Continue to default departments logic below
      } else if (error.message.includes('policy') || error.code === 'PGRST301' || error.message.includes('JWT')) {
        // If RLS policy issue, provide specific guidance
        return NextResponse.json({ 
          error: 'Database access denied due to RLS policies.',
          details: error.message,
          suggestion: 'Run this SQL command in Supabase: CREATE POLICY "service_role_full_access" ON departments FOR ALL TO service_role USING (true) WITH CHECK (true);'
        }, { status: 401 });
      } else {
        // Other database errors
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
