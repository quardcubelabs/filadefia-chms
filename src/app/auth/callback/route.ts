import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const origin = requestUrl.origin;

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (code) {
    try {
      const supabase = await createClient();
      
      if (!supabase) {
        console.error('Supabase client not available');
        return NextResponse.redirect(`${origin}/login?error=Configuration error`);
      }

      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError);
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
        );
      }

      if (!data.session) {
        console.error('No session returned after code exchange');
        return NextResponse.redirect(`${origin}/login?error=Failed to create session`);
      }

      // Get user profile to determine redirect destination
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, department_id')
        .eq('user_id', data.user.id)
        .single();

      // Determine redirect based on role
      let redirectTo = '/dashboard';

      if (profile?.role === 'department_leader' && profile.department_id) {
        redirectTo = `/departments/${profile.department_id}`;
      }

      // Create response with redirect
      const response = NextResponse.redirect(`${origin}${redirectTo}`);

      return response;
    } catch (err) {
      console.error('Exception in auth callback:', err);
      return NextResponse.redirect(`${origin}/login?error=An unexpected error occurred`);
    }
  }

  // No code provided - redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
