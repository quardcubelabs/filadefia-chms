import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}

// GET - Fetch maintenance records for an asset
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    
    const assetId = searchParams.get('asset_id');

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('asset_maintenance')
      .select('*')
      .eq('asset_id', assetId)
      .order('performed_date', { ascending: false });

    if (error) {
      console.error('Error fetching maintenance records:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new maintenance record
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();

    const {
      asset_id,
      maintenance_type,
      description,
      cost = 0,
      currency = 'TZS',
      performed_by,
      performed_date,
      next_maintenance_date,
      notes,
      created_by
    } = body;

    if (!asset_id || !maintenance_type || !description || !performed_date || !created_by) {
      return NextResponse.json(
        { error: 'Asset ID, maintenance type, description, date, and creator are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('asset_maintenance')
      .insert({
        asset_id,
        maintenance_type,
        description,
        cost,
        currency,
        performed_by,
        performed_date,
        next_maintenance_date,
        notes,
        created_by
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating maintenance record:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update asset status if under maintenance
    if (maintenance_type === 'repair') {
      await supabase
        .from('assets')
        .update({ status: 'under_maintenance' })
        .eq('id', asset_id);
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a maintenance record
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Maintenance record ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('asset_maintenance')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting maintenance record:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Maintenance record deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
