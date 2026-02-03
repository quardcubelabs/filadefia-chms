import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST - Convert visitor to member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      throw new Error('Service role key is not set');
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    // First, get the visitor data
    const { data: visitor, error: fetchError } = await adminClient
      .from('visitors')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching visitor:', fetchError);
      throw new Error('Visitor not found');
    }

    if (visitor.converted) {
      return NextResponse.json(
        { success: false, error: 'This visitor has already been converted to a member' },
        { status: 400 }
      );
    }

    // Create the member record from visitor data
    const memberData = {
      first_name: visitor.first_name,
      last_name: visitor.last_name,
      phone: visitor.phone,
      email: visitor.email,
      address: visitor.address,
      gender: visitor.gender,
      date_of_birth: visitor.date_of_birth,
      marital_status: visitor.marital_status,
      occupation: visitor.occupation,
      membership_status: 'new_convert',
      membership_date: new Date().toISOString().split('T')[0],
      is_active: true,
      notes: visitor.notes ? `Converted from visitor. Original notes: ${visitor.notes}` : 'Converted from visitor'
    };

    // Insert into members table
    const { data: newMember, error: memberError } = await adminClient
      .from('members')
      .insert([memberData])
      .select()
      .single();

    if (memberError) {
      console.error('Error creating member:', memberError);
      throw new Error(`Failed to create member: ${memberError.message}`);
    }

    // Update visitor record to mark as converted and link to new member
    const { error: updateError } = await adminClient
      .from('visitors')
      .update({
        converted: true,
        conversion_date: new Date().toISOString().split('T')[0],
        status: 'converted',
        notes: visitor.notes 
          ? `${visitor.notes}\n\nConverted to member ID: ${newMember.id}` 
          : `Converted to member ID: ${newMember.id}`
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating visitor:', updateError);
      // Don't throw here - member was created successfully
    }

    return NextResponse.json({
      success: true,
      data: {
        visitor_id: id,
        member_id: newMember.id,
        member: newMember
      },
      message: `${visitor.first_name} ${visitor.last_name} has been added to members!`
    });

  } catch (error: any) {
    console.error('Error converting visitor to member:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
