import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { config, isSupabaseConfigured } from '@/lib/config'

export async function createClient() {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase environment variables not configured. Some features may not work.');
    // Return a mock client for build-time
    return null as any;
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
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}