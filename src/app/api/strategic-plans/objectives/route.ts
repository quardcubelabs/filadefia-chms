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

// GET - Fetch objectives for a goal
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    
    const goalId = searchParams.get('goal_id');
    const status = searchParams.get('status');

    if (!goalId) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    let query = supabase
      .from('strategic_objectives')
      .select(`
        *,
        assignee:members!strategic_objectives_assigned_to_fkey(id, first_name, last_name, phone)
      `)
      .eq('strategic_goal_id', goalId)
      .order('order_index', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching strategic objectives:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new objective
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();

    const {
      strategic_goal_id,
      title,
      description,
      key_result,
      assigned_to,
      due_date
    } = body;

    if (!strategic_goal_id || !title) {
      return NextResponse.json(
        { error: 'Goal ID and title are required' },
        { status: 400 }
      );
    }

    // Get the highest order_index for this goal
    const { data: existingObjectives } = await supabase
      .from('strategic_objectives')
      .select('order_index')
      .eq('strategic_goal_id', strategic_goal_id)
      .order('order_index', { ascending: false })
      .limit(1);

    const newOrderIndex = existingObjectives && existingObjectives.length > 0 
      ? existingObjectives[0].order_index + 1 
      : 0;

    const { data, error } = await supabase
      .from('strategic_objectives')
      .insert({
        strategic_goal_id,
        title,
        description,
        key_result,
        assigned_to,
        due_date,
        order_index: newOrderIndex
      })
      .select(`
        *,
        assignee:members!strategic_objectives_assigned_to_fkey(id, first_name, last_name, phone)
      `)
      .single();

    if (error) {
      console.error('Error creating strategic objective:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update an objective
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Objective ID is required' }, { status: 400 });
    }

    // If marking as completed, set progress to 100
    if (updateData.status === 'completed') {
      updateData.progress = 100;
    }

    const { data, error } = await supabase
      .from('strategic_objectives')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        assignee:members!strategic_objectives_assigned_to_fkey(id, first_name, last_name, phone)
      `)
      .single();

    if (error) {
      console.error('Error updating strategic objective:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete an objective
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Objective ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('strategic_objectives')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting strategic objective:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Strategic objective deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
