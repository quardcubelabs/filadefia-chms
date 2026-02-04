'use server';

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Fetch all objectives assigned to the logged-in user
export async function GET(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the user's member_id from the search params
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member_id');
    
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }
    
    // Fetch objectives assigned to this member
    const { data: objectives, error } = await supabase
      .from('strategic_objectives')
      .select(`
        *,
        goal:strategic_goals (
          id,
          title,
          description,
          status,
          progress,
          priority,
          plan:strategic_plans (
            id,
            title,
            scope,
            year_start,
            year_end,
            status
          )
        )
      `)
      .eq('assigned_to', memberId)
      .order('due_date', { ascending: true, nullsFirst: false });
    
    if (error) {
      console.error('Error fetching assigned objectives:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Group objectives by status for easier display
    const groupedObjectives = {
      overdue: objectives?.filter(o => {
        if (!o.due_date) return false;
        return new Date(o.due_date) < new Date() && o.status !== 'completed' && o.status !== 'cancelled';
      }) || [],
      in_progress: objectives?.filter(o => o.status === 'in_progress') || [],
      pending: objectives?.filter(o => o.status === 'pending') || [],
      completed: objectives?.filter(o => o.status === 'completed') || [],
      cancelled: objectives?.filter(o => o.status === 'cancelled') || []
    };
    
    // Calculate summary stats
    const stats = {
      total: objectives?.length || 0,
      completed: groupedObjectives.completed.length,
      in_progress: groupedObjectives.in_progress.length,
      pending: groupedObjectives.pending.length,
      overdue: groupedObjectives.overdue.length,
      completion_rate: objectives?.length ? 
        Math.round((groupedObjectives.completed.length / objectives.length) * 100) : 0
    };
    
    return NextResponse.json({
      objectives,
      grouped: groupedObjectives,
      stats
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching assigned objectives:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH - Update objective progress (for assigned leaders)
export async function PATCH(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    
    const { objective_id, member_id, progress, status, notes } = body;
    
    if (!objective_id || !member_id) {
      return NextResponse.json(
        { error: 'Objective ID and Member ID are required' }, 
        { status: 400 }
      );
    }
    
    // Verify this objective is assigned to this member
    const { data: objective, error: fetchError } = await supabase
      .from('strategic_objectives')
      .select('*, strategic_goal_id')
      .eq('id', objective_id)
      .eq('assigned_to', member_id)
      .single();
    
    if (fetchError || !objective) {
      return NextResponse.json(
        { error: 'Objective not found or not assigned to this member' }, 
        { status: 404 }
      );
    }
    
    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };
    
    if (progress !== undefined) {
      updateData.progress = Math.min(100, Math.max(0, progress));
    }
    
    if (status) {
      updateData.status = status;
      // Auto-set progress to 100 if completed
      if (status === 'completed') {
        updateData.progress = 100;
      }
    }
    
    // Update the objective
    const { data: updated, error: updateError } = await supabase
      .from('strategic_objectives')
      .update(updateData)
      .eq('id', objective_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating objective:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    // Now update the parent goal's progress based on all its objectives
    const { data: allObjectives } = await supabase
      .from('strategic_objectives')
      .select('progress, status')
      .eq('strategic_goal_id', objective.strategic_goal_id);
    
    if (allObjectives && allObjectives.length > 0) {
      const avgProgress = Math.round(
        allObjectives.reduce((sum, obj) => sum + (obj.progress || 0), 0) / allObjectives.length
      );
      
      const completedCount = allObjectives.filter(o => o.status === 'completed').length;
      let goalStatus = 'pending';
      
      if (completedCount === allObjectives.length) {
        goalStatus = 'completed';
      } else if (completedCount > 0 || avgProgress > 0) {
        goalStatus = 'in_progress';
      }
      
      await supabase
        .from('strategic_goals')
        .update({
          progress: avgProgress,
          status: goalStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', objective.strategic_goal_id);
    }
    
    return NextResponse.json({ 
      success: true, 
      objective: updated,
      message: 'Objective updated successfully'
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error updating objective:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
