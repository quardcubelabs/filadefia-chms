import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  
  const supabase = await createClient();
  
  if (!supabase) {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (authData.user) {
      // Get user profile with role information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Login successful',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          profile,
        },
      });
    }

    return NextResponse.json({ error: 'Login failed' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}