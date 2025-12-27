'use client';

// Re-export everything from the AuthContext for backward compatibility
// This allows existing imports from '@/hooks/useAuth' to continue working

export {
  useAuthContext as useAuth,
  useAuthContext,
  AuthProvider,
  AuthStatus,
  type AuthUser,
} from '@/contexts/AuthContext';

import { useAuthContext, AuthStatus } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Hook for protecting routes - enhanced with better state handling
export function useRequireAuth(requiredRole?: UserRole) {
  const router = useRouter();
  const { user, status, canAccess } = useAuthContext();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Don't redirect while still loading
    if (status === AuthStatus.LOADING) return;

    // Not authenticated - redirect to login
    if (status === AuthStatus.UNAUTHENTICATED || !user) {
      router.replace('/login');
      return;
    }

    // Check role if required
    if (requiredRole && !canAccess(requiredRole)) {
      router.replace('/unauthorized');
      return;
    }

    // User is authorized
    setIsAuthorized(true);
  }, [user, status, requiredRole, canAccess, router]);

  return { 
    user, 
    loading: status === AuthStatus.LOADING,
    isAuthorized,
  };
}

// Hook for department leaders to check their department access
export function useDepartmentAccess() {
  const { user, supabase } = useAuthContext();
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDepartments = async () => {
      if (!user?.profile || !supabase) {
        setDepartments([]);
        setLoading(false);
        return;
      }

      try {
        // Admins and pastors can access all departments
        if (user.profile.role === 'administrator' || user.profile.role === 'pastor') {
          const { data: allDepts } = await supabase
            .from('departments')
            .select('id');
          
          setDepartments(allDepts?.map((d: { id: string }) => d.id) || []);
          setLoading(false);
          return;
        }

        // Get departments where user is a leader
        if (user.profile.role === 'department_leader') {
          const { data: userDepts } = await supabase
            .from('departments')
            .select('id')
            .eq('leader_id', user.profile.id);
          
          setDepartments(userDepts?.map((d: { id: string }) => d.id) || []);
          setLoading(false);
          return;
        }

        setDepartments([]);
      } catch (error) {
        console.error('Error loading departments:', error);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, [user, supabase]);

  const canAccessDepartment = (departmentId: string): boolean => {
    return departments.includes(departmentId);
  };

  return {
    departments,
    loading,
    canAccessDepartment,
  };
}
