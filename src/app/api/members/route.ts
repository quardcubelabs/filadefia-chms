import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
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

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
