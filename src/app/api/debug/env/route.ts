import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
    service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
    supabase_url_preview: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
      process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'N/A',
    vercel: process.env.VERCEL ? 'Yes' : 'No'
  });
}