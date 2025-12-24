import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const departmentId = searchParams.get('department_id');

    let query = supabase
      .from('members')
      .select('id, first_name, last_name, member_number, photo_url')
      .eq('status', status)
      .order('first_name', { ascending: true });

    if (departmentId) {
      query = query.in('id',
        supabase
          .from('department_members')
          .select('member_id')
          .eq('department_id', departmentId)
          .eq('is_active', true)
      );
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
