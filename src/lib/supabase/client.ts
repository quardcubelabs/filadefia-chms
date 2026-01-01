import { createBrowserClient } from '@supabase/ssr'
import { config, isSupabaseConfigured } from '@/lib/config'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton pattern for browser client to prevent multiple instances
let browserClient: SupabaseClient | null = null;

export function createClient(): SupabaseClient | null {
  // Return cached client if exists (browser only)
  if (typeof window !== 'undefined' && browserClient) {
    return browserClient;
  }

  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase environment variables not configured!');
    }
    return null;
  }
  
  const client = createBrowserClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'x-client-info': 'fcc-chms',
        },
      },
    }
  );

  // Cache in browser environment
  if (typeof window !== 'undefined') {
    browserClient = client;
  }

  return client;
}

// Export type for use in other files
export type { SupabaseClient }