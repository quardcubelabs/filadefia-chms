import { createBrowserClient } from '@supabase/ssr'
import { config, isSupabaseConfigured } from '@/lib/config'

export function createClient() {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase environment variables not configured. Some features may not work.');
    // Return a mock client for build-time
    return null as any;
  }
  
  return createBrowserClient(config.supabase.url, config.supabase.anonKey);
}