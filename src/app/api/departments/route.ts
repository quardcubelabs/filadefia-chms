import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ 
        error: 'NEXT_PUBLIC_SUPABASE_URL is not configured' 
      }, { status: 500 });
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' 
      }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('departments')
      .select('id, name, swahili_name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching departments:', error);
      
      // If departments table doesn't exist, return empty array with explanation
      if (error.code === '42P01') {
        return NextResponse.json({ 
          data: [],
          message: 'Departments table not found. Please set up the departments in your database.'
        });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no departments found, return default departments for church structure
    if (!data || data.length === 0) {
      const defaultDepartments = [
        { id: 'default-1', name: 'General Assembly', swahili_name: 'Mkutano wa Jumla' },
        { id: 'default-2', name: 'Youth Department', swahili_name: 'Idara ya Vijana' },
        { id: 'default-3', name: 'Women Department', swahili_name: 'Idara ya Wanawake' },
        { id: 'default-4', name: 'Men Department', swahili_name: 'Idara ya Wanaume' },
        { id: 'default-5', name: 'Children Department', swahili_name: 'Idara ya Watoto' },
      ];
      
      return NextResponse.json({ 
        data: defaultDepartments,
        message: 'Using default departments. Please set up departments in your database for customization.'
      });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
