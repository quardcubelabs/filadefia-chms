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

// GET - Fetch goals for a strategic plan
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    
    const strategicPlanId = searchParams.get('strategic_plan_id');
    const status = searchParams.get('status');

    if (!strategicPlanId) {
      return NextResponse.json({ error: 'Strategic plan ID is required' }, { status: 400 });
    }

    let query = supabase
      .from('strategic_goals')
      .select('*')
      .eq('strategic_plan_id', strategicPlanId)
      .order('order_index', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching strategic goals:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch objective counts for each goal
    const goalsWithCounts = await Promise.all(
      (data || []).map(async (goal) => {
        const { count: objectiveCount } = await supabase
          .from('strategic_objectives')
          .select('*', { count: 'exact', head: true })
          .eq('strategic_goal_id', goal.id);

        const { count: completedObjectives } = await supabase
          .from('strategic_objectives')
          .select('*', { count: 'exact', head: true })
          .eq('strategic_goal_id', goal.id)
          .eq('status', 'completed');

        return {
          ...goal,
          objective_count: objectiveCount || 0,
          completed_objectives: completedObjectives || 0,
        };
      })
    );

    return NextResponse.json({ data: goalsWithCounts });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();

    const {
      strategic_plan_id,
      title,
      description,
      target_metric,
      target_value,
      priority = 'medium'
    } = body;

    if (!strategic_plan_id || !title) {
      return NextResponse.json(
        { error: 'Strategic plan ID and title are required' },
        { status: 400 }
      );
    }

    // Get the highest order_index for this plan
    const { data: existingGoals } = await supabase
      .from('strategic_goals')
      .select('order_index')
      .eq('strategic_plan_id', strategic_plan_id)
      .order('order_index', { ascending: false })
      .limit(1);

    const newOrderIndex = existingGoals && existingGoals.length > 0 
      ? existingGoals[0].order_index + 1 
      : 0;

    const { data, error } = await supabase
      .from('strategic_goals')
      .insert({
        strategic_plan_id,
        title,
        description,
        target_metric,
        target_value,
        priority,
        order_index: newOrderIndex
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating strategic goal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update a goal
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    // If marking as completed, set progress to 100
    if (updateData.status === 'completed') {
      updateData.progress = 100;
    }

    const { data, error } = await supabase
      .from('strategic_goals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating strategic goal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a goal
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('strategic_goals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting strategic goal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Strategic goal deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
