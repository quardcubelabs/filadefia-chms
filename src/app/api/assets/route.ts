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

// GET - Fetch assets
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const condition = searchParams.get('condition');
    const departmentId = searchParams.get('department_id');
    const search = searchParams.get('search');

    let query = supabase
      .from('assets')
      .select(`
        *,
        department:departments(id, name, swahili_name),
        assignee:members!assets_assigned_to_fkey(id, first_name, last_name, phone),
        creator:profiles!assets_created_by_fkey(id, first_name, last_name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (condition) {
      query = query.eq('condition', condition);
    }

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,asset_number.ilike.%${search}%,brand.ilike.%${search}%,serial_number.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching assets:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch maintenance counts for each asset
    const assetsWithCounts = await Promise.all(
      (data || []).map(async (asset) => {
        const { count: maintenanceCount } = await supabase
          .from('asset_maintenance')
          .select('*', { count: 'exact', head: true })
          .eq('asset_id', asset.id);

        return {
          ...asset,
          maintenance_count: maintenanceCount || 0,
        };
      })
    );

    return NextResponse.json({ data: assetsWithCounts });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new asset
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();

    const {
      name,
      description,
      category,
      condition = 'good',
      status = 'active',
      purchase_date,
      purchase_price,
      current_value,
      currency = 'TZS',
      location,
      department_id,
      assigned_to,
      brand,
      model,
      serial_number,
      warranty_expiry,
      photo_url,
      receipt_url,
      notes,
      created_by
    } = body;

    if (!name || !category || !created_by) {
      return NextResponse.json(
        { error: 'Name, category, and creator are required' },
        { status: 400 }
      );
    }

    // Generate asset number
    const { data: assetNumber, error: numError } = await supabase
      .rpc('generate_asset_number');

    if (numError) {
      // Fallback to simple generation if function doesn't exist
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-4);
      const fallbackNumber = `FCC-${year}-${timestamp}`;
      
      const { data, error } = await supabase
        .from('assets')
        .insert({
          asset_number: fallbackNumber,
          name,
          description,
          category,
          condition,
          status,
          purchase_date,
          purchase_price,
          current_value: current_value || purchase_price,
          currency,
          location,
          department_id,
          assigned_to,
          brand,
          model,
          serial_number,
          warranty_expiry,
          photo_url,
          receipt_url,
          notes,
          created_by
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating asset:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data }, { status: 201 });
    }

    const { data, error } = await supabase
      .from('assets')
      .insert({
        asset_number: assetNumber,
        name,
        description,
        category,
        condition,
        status,
        purchase_date,
        purchase_price,
        current_value: current_value || purchase_price,
        currency,
        location,
        department_id,
        assigned_to,
        brand,
        model,
        serial_number,
        warranty_expiry,
        photo_url,
        receipt_url,
        notes,
        created_by
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating asset:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update an asset
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('assets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating asset:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Soft delete an asset
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('assets')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting asset:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
