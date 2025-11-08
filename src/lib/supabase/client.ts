import { createBrowserClient } from '@supabase/ssr'
import { config, isSupabaseConfigured } from '@/lib/config'

export function createClient() {
  if (!isSupabaseConfigured()) {
    console.error('Supabase environment variables not configured!');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', config.supabase.url ? 'Set' : 'Missing');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', config.supabase.anonKey ? 'Set' : 'Missing');
    // Return a mock client for build-time
    return null as any;
  }
  
  console.log('Creating Supabase client...');
  return createBrowserClient(config.supabase.url, config.supabase.anonKey);
}