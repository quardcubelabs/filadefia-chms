'use client';

import Link from 'next/link';

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-fcc-blue-50 to-fcc-gold-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-fcc-gradient rounded-full flex items-center justify-center mb-6">
            <span className="text-2xl font-bold text-white">FCC</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Setup Required
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            The FCC Church Management System needs to be configured with Supabase to function properly.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Configuration Steps:</h3>
            <ol className="text-left text-blue-700 space-y-2">
              <li>1. Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
              <li>2. Run the database schema from <code>/database/schema.sql</code></li>
              <li>3. Set environment variables in Vercel/deployment platform</li>
              <li>4. Redeploy the application</li>
            </ol>
          </div>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              <p><strong>Required Environment Variables:</strong></p>
              <code className="block bg-gray-100 p-2 rounded mt-2 text-xs">
                NEXT_PUBLIC_SUPABASE_URL<br/>
                NEXT_PUBLIC_SUPABASE_ANON_KEY<br/>
                SUPABASE_SERVICE_ROLE_KEY
              </code>
            </div>
            
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white fcc-button-primary"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}