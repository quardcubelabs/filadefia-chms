import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch ratings for a leader or all leaders
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const searchParams = request.nextUrl.searchParams;
    const leaderId = searchParams.get('leader_id');

    let query = supabase
      .from('leader_ratings')
      .select(`
        *,
        rater:rated_by(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (leaderId) {
      query = query.eq('leader_id', leaderId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate average rating per leader
    const leaderRatings: Record<string, { average: number; count: number; ratings: any[] }> = {};
    
    data?.forEach(rating => {
      if (!leaderRatings[rating.leader_id]) {
        leaderRatings[rating.leader_id] = { average: 0, count: 0, ratings: [] };
      }
      leaderRatings[rating.leader_id].ratings.push(rating);
      leaderRatings[rating.leader_id].count++;
    });

    // Calculate averages
    Object.keys(leaderRatings).forEach(id => {
      const sum = leaderRatings[id].ratings.reduce((acc, r) => acc + r.rating, 0);
      leaderRatings[id].average = sum / leaderRatings[id].count;
    });

    return NextResponse.json({
      success: true,
      data: leaderId ? leaderRatings[leaderId] || { average: 0, count: 0, ratings: [] } : leaderRatings
    });
  } catch (error: any) {
    console.error('Error fetching leader ratings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or update a rating
export async function POST(request: NextRequest) {
  try {
    const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      throw new Error('Service role key is not set');
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    const body = await request.json();
    
    // Validate required fields
    if (!body.leader_id || !body.department_id || !body.rated_by || !body.rating) {
      return NextResponse.json(
        { success: false, error: 'leader_id, department_id, rated_by, and rating are required' },
        { status: 400 }
      );
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Upsert rating (update if exists, insert if not)
    const { data, error } = await adminClient
      .from('leader_ratings')
      .upsert(
        {
          leader_id: body.leader_id,
          department_id: body.department_id,
          rated_by: body.rated_by,
          rating: body.rating,
          review: body.review || null,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'leader_id,rated_by'
        }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error saving leader rating:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
