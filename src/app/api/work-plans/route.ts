import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// GET - Fetch work plans
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    
    const scope = searchParams.get('scope');
    const departmentId = searchParams.get('department_id');
    const zoneId = searchParams.get('zone_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('work_plans')
      .select(`
        *,
        department:departments(id, name, swahili_name),
        zone:zones(id, name, swahili_name),
        creator:profiles!work_plans_created_by_fkey(id, first_name, last_name),
        approver:profiles!work_plans_approved_by_fkey(id, first_name, last_name)
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
      console.error('Error fetching work plans:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch task counts for each work plan
    const workPlansWithCounts = await Promise.all(
      (data || []).map(async (plan) => {
        const { count: taskCount } = await supabase
          .from('work_plan_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('work_plan_id', plan.id);

        const { count: completedTasks } = await supabase
          .from('work_plan_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('work_plan_id', plan.id)
          .eq('status', 'completed');

        return {
          ...plan,
          task_count: taskCount || 0,
          completed_tasks: completedTasks || 0,
        };
      })
    );

    return NextResponse.json({ data: workPlansWithCounts });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new work plan
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    const {
      title,
      description,
      scope,
      department_id,
      zone_id,
      start_date,
      end_date,
      status = 'draft',
      budget,
      currency = 'TZS',
      notes,
      created_by
    } = body;

    if (!title || !scope || !start_date || !end_date || !created_by) {
      return NextResponse.json(
        { error: 'Title, scope, start date, end date, and creator are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('work_plans')
      .insert({
        title,
        description,
        scope,
        department_id: scope === 'department' ? department_id : null,
        zone_id: scope === 'zone' ? zone_id : null,
        start_date,
        end_date,
        status,
        budget,
        currency,
        notes,
        created_by
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating work plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a work plan
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Work plan ID is required' }, { status: 400 });
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
      .from('work_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating work plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Soft delete a work plan
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Work plan ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('work_plans')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting work plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Work plan deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
