import { NextResponse } from 'next/server';

// Debug endpoint to check environment variable status (not values for security)
export async function GET() {
  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // Show partial URL for debugging (first 30 chars)
    urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL 
      ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...'
      : 'NOT SET',
    // Check if service key looks valid (starts with expected pattern)
    serviceKeyValid: process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ') || false,
    nodeEnv: process.env.NODE_ENV,
  };

  return NextResponse.json(envStatus);
}
