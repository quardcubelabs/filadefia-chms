import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ 
        error: 'NEXT_PUBLIC_SUPABASE_URL is not configured' 
      }, { status: 500 });
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' 
      }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const departmentId = searchParams.get('department_id');

    let query = supabase
      .from('members')
      .select('id, first_name, last_name, member_number, photo_url')
      .eq('status', status)
      .order('first_name', { ascending: true });

    if (departmentId) {
      // First get the member IDs from department_members
      const { data: departmentMembers, error: deptError } = await supabase
        .from('department_members')
        .select('member_id')
        .eq('department_id', departmentId)
        .eq('is_active', true);

      if (deptError) {
        console.error('Error fetching department members:', deptError);
        return NextResponse.json({ error: deptError.message }, { status: 500 });
      }

      // Extract the member IDs
      const memberIds = departmentMembers?.map(dm => dm.member_id) || [];
      
      // Filter members by the department member IDs
      if (memberIds.length > 0) {
        query = query.in('id', memberIds);
      } else {
        // No members in this department, return empty result
        return NextResponse.json({ data: [] });
      }
    }

    let { data, error } = await query;

    // If RLS blocks direct access, try RPC function
    if (error && (error.message.includes('policy') || error.code === 'PGRST301' || error.message.includes('JWT'))) {
      console.log('Direct member access failed, trying RPC function...');
      const rpcResult = await supabase.rpc('get_members', departmentId ? { dept_id: departmentId } : {});
      data = rpcResult.data;
      error = rpcResult.error;
    }

    if (error) {
      console.error('Error fetching members:', error);
      
      // If members table doesn't exist, return empty array
      if (error.code === '42P01') {
        return NextResponse.json({ 
          data: [],
          message: 'Members table not found. Please set up the members in your database.'
        });
      }
      
      // If RLS policy issue
      if (error.message.includes('policy') || error.code === 'PGRST301' || error.message.includes('JWT')) {
        return NextResponse.json({ 
          error: 'Database access denied due to RLS policies.',
          details: error.message,
          suggestion: 'Run the complete_attendance_setup.sql script in your database.'
        }, { status: 401 });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
