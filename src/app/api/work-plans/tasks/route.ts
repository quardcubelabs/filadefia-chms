import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

// GET - Fetch tasks for a work plan
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    
    const workPlanId = searchParams.get('work_plan_id');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assigned_to');

    if (!workPlanId) {
      return NextResponse.json({ error: 'Work plan ID is required' }, { status: 400 });
    }

    let query = supabase
      .from('work_plan_tasks')
      .select(`
        *,
        assignee:members!work_plan_tasks_assigned_to_fkey(id, first_name, last_name, phone)
      `)
      .eq('work_plan_id', workPlanId)
      .order('order_index', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching work plan tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();

    const {
      work_plan_id,
      title,
      description,
      assigned_to,
      priority = 'medium',
      start_date,
      due_date,
      notes,
      created_by
    } = body;

    if (!work_plan_id || !title || !created_by) {
      return NextResponse.json(
        { error: 'Work plan ID, title, and creator are required' },
        { status: 400 }
      );
    }

    // Get the highest order_index for this work plan
    const { data: existingTasks } = await supabase
      .from('work_plan_tasks')
      .select('order_index')
      .eq('work_plan_id', work_plan_id)
      .order('order_index', { ascending: false })
      .limit(1);

    const newOrderIndex = existingTasks && existingTasks.length > 0 
      ? existingTasks[0].order_index + 1 
      : 0;

    const { data, error } = await supabase
      .from('work_plan_tasks')
      .insert({
        work_plan_id,
        title,
        description,
        assigned_to,
        priority,
        start_date,
        due_date,
        notes,
        created_by,
        order_index: newOrderIndex
      })
      .select(`
        *,
        assignee:members!work_plan_tasks_assigned_to_fkey(id, first_name, last_name, phone)
      `)
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a task
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // If marking as completed, set the completed_date
    if (updateData.status === 'completed' && !updateData.completed_date) {
      updateData.completed_date = new Date().toISOString().split('T')[0];
      updateData.progress = 100;
    }

    const { data, error } = await supabase
      .from('work_plan_tasks')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        assignee:members!work_plan_tasks_assigned_to_fkey(id, first_name, last_name, phone)
      `)
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a task
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('work_plan_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
