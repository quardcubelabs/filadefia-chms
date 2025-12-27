'use client';

import { useAuthContext, AuthStatus } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

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
 * 
 * Features:
 * - Shows loading state during auth check (prevents blank pages)
 * - Redirects to login if unauthenticated
 * - Checks role permissions if requiredRole is provided
 * - Prevents premature redirects during token refresh
 */
export function ProtectedLayout({ 
  children, 
  requiredRole,
  fallback = <DefaultLoadingFallback />
}: ProtectedLayoutProps) {
  const router = useRouter();
  const { user, status, canAccess } = useAuthContext();

  useEffect(() => {
    // Don't redirect while loading - prevents blank pages and premature redirects
    if (status === AuthStatus.LOADING) return;

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
  }, [status, user, requiredRole, canAccess, router]);

  // Show loading state during auth check
  if (status === AuthStatus.LOADING) {
    return <>{fallback}</>;
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
