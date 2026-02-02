import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - Fetch all zones
export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ 
        error: 'NEXT_PUBLIC_SUPABASE_URL is not configured' 
      }, { status: 500 });
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY is not configured' 
      }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    // Build query
    let query = supabase
      .from('zones')
      .select('*')
      .order('name');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: zones, error } = await query;

    if (error) {
      console.error('Error fetching zones:', error);
      return NextResponse.json(
        { error: 'Failed to fetch zones', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: zones || [] });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// POST - Create a new zone
export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { name, swahili_name, description, leader_id } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Zone name is required' },
        { status: 400 }
      );
    }

    const { data: zone, error } = await supabase
      .from('zones')
      .insert({
        name,
        swahili_name: swahili_name || null,
        description: description || null,
        leader_id: leader_id || null,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating zone:', error);
      return NextResponse.json(
        { error: 'Failed to create zone', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: zone });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
