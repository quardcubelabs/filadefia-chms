import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET - Fetch all visitors with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const followed_up = searchParams.get('followed_up');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    let query = supabase.from('visitors').select(
      `*,
      referred_by_member:referred_by_member_id(id, first_name, last_name),
      followed_up_by_profile:followed_up_by(id, first_name, last_name)
      `,
      { count: 'exact' }
    );

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (followed_up === 'true') {
      query = query.eq('followed_up', true);
    } else if (followed_up === 'false') {
      query = query.eq('followed_up', false);
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    // Order by visited_date descending
    query = query.order('visited_date', { ascending: false });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      count: count || 0,
      total_pages: Math.ceil((count || 0) / limit)
    });
  } catch (error: any) {
    console.error('Error fetching visitors:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new visitor
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
    if (!body.first_name || !body.last_name || !body.visited_date) {
      return NextResponse.json(
        { success: false, error: 'first_name, last_name, and visited_date are required' },
        { status: 400 }
      );
    }

    const { data, error } = await adminClient
      .from('visitors')
      .insert([
        {
          first_name: body.first_name,
          last_name: body.last_name,
          phone: body.phone || null,
          email: body.email || null,
          address: body.address || null,
          gender: body.gender || null,
          date_of_birth: body.date_of_birth || null,
          marital_status: body.marital_status || null,
          occupation: body.occupation || null,
          how_did_you_hear: body.how_did_you_hear || null,
          referred_by_member_id: body.referred_by_member_id || null,
          visited_date: body.visited_date,
          notes: body.notes || null
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating visitor:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
