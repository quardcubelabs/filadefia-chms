import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password, firstName, lastName, phone, role = 'member' } = await request.json();
  
  const supabase = await createClient();

  try {
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (authData.user) {
      // Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: authData.user.id,
            email: authData.user.email,
            first_name: firstName,
            last_name: lastName,
            phone,
            role,
          },
        ]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Note: In production, you might want to handle cleanup of the auth user
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      return NextResponse.json({
        message: 'User created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      });
    }

    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}