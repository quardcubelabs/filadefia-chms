import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

// GET - Fetch strategic plans
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    
    const scope = searchParams.get('scope');
    const departmentId = searchParams.get('department_id');
    const zoneId = searchParams.get('zone_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('strategic_plans')
      .select(`
        *,
        department:departments(id, name, swahili_name),
        zone:zones(id, name, swahili_name),
        creator:profiles!strategic_plans_created_by_fkey(id, first_name, last_name),
        approver:profiles!strategic_plans_approved_by_fkey(id, first_name, last_name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (scope) {
      query = query.eq('scope', scope);
    }

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    if (zoneId) {
      query = query.eq('zone_id', zoneId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching strategic plans:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch goal counts for each strategic plan
    const plansWithCounts = await Promise.all(
      (data || []).map(async (plan) => {
        const { count: goalCount } = await supabase
          .from('strategic_goals')
          .select('*', { count: 'exact', head: true })
          .eq('strategic_plan_id', plan.id);

        const { count: completedGoals } = await supabase
          .from('strategic_goals')
          .select('*', { count: 'exact', head: true })
          .eq('strategic_plan_id', plan.id)
          .eq('status', 'completed');

        return {
          ...plan,
          goal_count: goalCount || 0,
          completed_goals: completedGoals || 0,
        };
      })
    );

    return NextResponse.json({ data: plansWithCounts });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new strategic plan
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();

    const {
      title,
      vision,
      mission,
      description,
      scope,
      department_id,
      zone_id,
      year_start,
      year_end,
      status = 'draft',
      created_by
    } = body;

    if (!title || !scope || !year_start || !year_end || !created_by) {
      return NextResponse.json(
        { error: 'Title, scope, year range, and creator are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('strategic_plans')
      .insert({
        title,
        vision,
        mission,
        description,
        scope,
        department_id: scope === 'department' ? department_id : null,
        zone_id: scope === 'zone' ? zone_id : null,
        year_start,
        year_end,
        status,
        created_by
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating strategic plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a strategic plan
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Strategic plan ID is required' }, { status: 400 });
    }

    // Handle scope changes
    if (updateData.scope) {
      if (updateData.scope === 'church') {
        updateData.department_id = null;
        updateData.zone_id = null;
      } else if (updateData.scope === 'department') {
        updateData.zone_id = null;
      } else if (updateData.scope === 'zone') {
        updateData.department_id = null;
      }
    }

    const { data, error } = await supabase
      .from('strategic_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating strategic plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Soft delete a strategic plan
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Strategic plan ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('strategic_plans')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting strategic plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Strategic plan deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
