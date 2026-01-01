'use client';

import { useAuthContext, AuthStatus } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';

interface ProtectedLayoutProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallback?: ReactNode;
}

// Default loading component
function DefaultLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

/**
 * ProtectedLayout - Wraps content that requires authentication
 */
export function ProtectedLayout({ 
  children, 
  requiredRole,
  fallback = <DefaultLoadingFallback />
}: ProtectedLayoutProps) {
  const router = useRouter();
  const { user, status, canAccess } = useAuthContext();
  const [timedOut, setTimedOut] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  // Delay showing loading spinner to prevent flicker on fast auth
  useEffect(() => {
    if (status === AuthStatus.LOADING) {
      const timer = setTimeout(() => setShowLoading(true), 200); // 200ms delay
      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
    }
  }, [status]);

  // Safety timeout - redirect to login if stuck loading for too long
  useEffect(() => {
    if (status !== AuthStatus.LOADING) return;

    const timeout = setTimeout(() => {
      setTimedOut(true);
    }, 12000);

    return () => clearTimeout(timeout);
  }, [status]);

  useEffect(() => {
    // Don't redirect while loading - prevents blank pages and premature redirects
    if (status === AuthStatus.LOADING && !timedOut) return;

    // Timed out waiting for auth - redirect to login
    if (timedOut && status === AuthStatus.LOADING) {
      router.replace('/login');
      return;
    }

    // Not authenticated - redirect to login
    if (status === AuthStatus.UNAUTHENTICATED) {
      router.replace('/login');
      return;
    }

    // Check role permissions
    if (requiredRole && user && !canAccess(requiredRole)) {
      router.replace('/unauthorized');
      return;
    }
  }, [status, user, requiredRole, canAccess, router, timedOut]);

  // Show loading state during auth check (with delay to prevent flicker)
  if (status === AuthStatus.LOADING && showLoading) {
    return <>{fallback}</>;
  }
  
  // Still loading but not showing spinner yet - render nothing briefly
  if (status === AuthStatus.LOADING) {
    return null;
  }

  // Show loading while redirecting
  if (status === AuthStatus.UNAUTHENTICATED) {
    return <>{fallback}</>;
  }

  // Check role access
  if (requiredRole && user && !canAccess(requiredRole)) {
    return <>{fallback}</>;
  }

  // User is authenticated (and authorized if role check passed)
  return <>{children}</>;
}

/**
 * AdminLayout - Shorthand for admin-only content
 */
export function AdminLayout({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedLayout requiredRole="administrator" fallback={fallback}>
      {children}
    </ProtectedLayout>
  );
}

/**
 * StaffLayout - For secretary, treasurer, pastor, admin roles
 */
export function StaffLayout({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedLayout requiredRole="secretary" fallback={fallback}>
      {children}
    </ProtectedLayout>
  );
}

/**
 * DepartmentLeaderLayout - For department leaders and above
 */
export function DepartmentLeaderLayout({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedLayout requiredRole="department_leader" fallback={fallback}>
      {children}
    </ProtectedLayout>
  );
}

export default ProtectedLayout;
