import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { config, isSupabaseConfigured } from '@/lib/config'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function createClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase environment variables not configured.');
    }
    return null;
  }

  const cookieStore = await cookies()

  return createServerClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                // Ensure cookies work in production
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              })
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

// Utility to get user from server context (with session refresh)
export async function getServerUser() {
  const supabase = await createClient()
  if (!supabase) return { user: null, profile: null }

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { user: null, profile: null }
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return { user, profile }
  } catch {
    return { user: null, profile: null }
  }
}