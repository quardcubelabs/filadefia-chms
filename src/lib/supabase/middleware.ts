import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { config, isSupabaseConfigured } from '@/lib/config'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/auth', '/unauthorized']
// Routes that should not trigger redirects (API routes, static assets)
const SKIP_ROUTES = ['/api', '/_next', '/favicon.ico']

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for certain routes
  if (SKIP_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  if (!isSupabaseConfigured()) {
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      config.supabase.url,
      config.supabase.anonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Update request cookies
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value)
            })
            // Create new response with updated request
            supabaseResponse = NextResponse.next({ request })
            // Set cookies on response
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, {
                ...options,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              })
            })
          },
        },
      }
    )

    // IMPORTANT: Use getUser() instead of getSession() for security
    // This validates the JWT with Supabase Auth server and refreshes if needed
    const { data: { user }, error } = await supabase.auth.getUser()

    // Check if user is authenticated
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
    const isAuthenticated = !!user && !error

    // Redirect unauthenticated users away from protected routes
    if (!isAuthenticated && !isPublicRoute) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // For root path, redirect based on auth status
    if (pathname === '/') {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    return supabaseResponse
  } catch (error) {
    // On any error, allow the request to proceed for public routes
    // or redirect to login for protected routes
    console.error('Middleware error:', error)
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
    
    if (!isPublicRoute) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    return supabaseResponse
  }
}