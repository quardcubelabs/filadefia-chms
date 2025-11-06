'use client';

import { createClient } from '@/lib/supabase/client';
import { Profile, UserRole } from '@/types';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  email: string | undefined;
  profile: Profile | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check if supabase client is available
    if (!supabase) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: any, session: any) => {
          if (session?.user) {
            await loadUserProfile(session.user);
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      );

        return () => subscription.unsubscribe();
    }
  }, [supabase]);

  const loadUserProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (error) {
        // Check if profile doesn't exist (PGRST116 is "not found" error)
        if (error.code === 'PGRST116') {
          console.log('Profile not found for user, creating basic profile...');
          
          // Create a basic profile for the user
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: authUser.id,
              email: authUser.email || '',
              role: 'member', // Default role
              first_name: authUser.email?.split('@')[0] || 'User',
              last_name: '',
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError.message);
            setUser({
              id: authUser.id,
              email: authUser.email,
              profile: null,
            });
          } else {
            console.log('Profile created successfully');
            setUser({
              id: authUser.id,
              email: authUser.email,
              profile: newProfile,
            });
          }
        } else {
          console.error('Error loading profile:', error.message, error.details);
          setUser({
            id: authUser.id,
            email: authUser.email,
            profile: null,
          });
        }
      } else {
        setUser({
          id: authUser.id,
          email: authUser.email,
          profile,
        });
      }
    } catch (error: any) {
      console.error('Exception loading profile:', error?.message || error);
      setUser({
        id: authUser.id,
        email: authUser.email,
        profile: null,
      });
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const hasRole = (requiredRoles: UserRole[]): boolean => {
    if (!user?.profile) return false;
    return requiredRoles.includes(user.profile.role);
  };

  const isAdmin = (): boolean => {
    return user?.profile?.role === 'administrator';
  };

  const isPastor = (): boolean => {
    return user?.profile?.role === 'pastor';
  };

  const isStaff = (): boolean => {
    return hasRole(['administrator', 'pastor', 'secretary', 'treasurer']);
  };

  const isDepartmentLeader = (): boolean => {
    return user?.profile?.role === 'department_leader';
  };

  const canAccess = (minimumRole: UserRole): boolean => {
    if (!user?.profile) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      member: 1,
      department_leader: 2,
      secretary: 3,
      treasurer: 3,
      pastor: 4,
      administrator: 5,
    };

    const userLevel = roleHierarchy[user.profile.role] || 0;
    const requiredLevel = roleHierarchy[minimumRole] || 0;
    
    return userLevel >= requiredLevel;
  };

  return {
    user,
    loading,
    signOut,
    hasRole,
    isAdmin,
    isPastor,
    isStaff,
    isDepartmentLeader,
    canAccess,
    supabase, // Expose supabase client for direct queries
  };
}

// Hook for protecting routes
export function useRequireAuth(requiredRole?: UserRole) {
  const { user, loading, canAccess } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login page
        window.location.href = '/login';
        return;
      }

      if (requiredRole && !canAccess(requiredRole)) {
        // Redirect to unauthorized page
        window.location.href = '/unauthorized';
        return;
      }
    }
  }, [user, loading, requiredRole, canAccess]);

  return { user, loading };
}

// Hook for department leaders to check their department access
export function useDepartmentAccess() {
  const { user, supabase } = useAuth();
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDepartments = async () => {
      if (!user?.profile) {
        setDepartments([]);
        setLoading(false);
        return;
      }

      // Admins and pastors can access all departments
      if (user.profile.role === 'administrator' || user.profile.role === 'pastor') {
        const { data: allDepts } = await supabase
          .from('departments')
          .select('id');
        
        setDepartments(allDepts?.map((d: any) => d.id) || []);
        setLoading(false);
        return;
      }

      // Get departments where user is a leader
      if (user.profile.role === 'department_leader') {
        const { data: userDepts } = await supabase
          .from('departments')
          .select('id')
          .eq('leader_id', user.profile.id);
        
        setDepartments(userDepts?.map((d: any) => d.id) || []);
        setLoading(false);
        return;
      }

      setDepartments([]);
      setLoading(false);
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