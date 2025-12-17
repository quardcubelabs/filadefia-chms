import { createBrowserClient } from '@supabase/ssr'
import { config, isSupabaseConfigured } from '@/lib/config'

export function createClient() {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase environment variables not configured!');
    console.warn('NEXT_PUBLIC_SUPABASE_URL:', config.supabase.url ? 'Set' : 'Missing');
    console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY:', config.supabase.anonKey ? 'Set' : 'Missing');
    // Return null during build-time when env vars are missing
    return null;
  }
  
  console.log('Creating Supabase client...');
  return createBrowserClient(config.supabase.url, config.supabase.anonKey);
}