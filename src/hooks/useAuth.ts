'use client';

import { createClient } from '@/lib/supabase/client';
import { Profile, UserRole } from '@/types';
import { User } from '@supabase/supabase-js';
import { useEffect, useState, useMemo } from 'react';

export interface AuthUser {
  id: string;
  email: string | undefined;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
    name?: string;
    [key: string]: any;
  };
  profile: Profile | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Create supabase client once and memoize it
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch (error) {
      console.warn('Failed to create Supabase client:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase client not available');
      setUser(null);
      setLoading(false);
      return;
    }

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
            console.log('User metadata:', authUser.user_metadata);
            
            // Extract Google profile data from user metadata
            const fullName = authUser.user_metadata?.full_name || '';
            const avatarUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '';
            
            // Parse first and last name
            let firstName = '';
            let lastName = '';
            
            if (fullName) {
              const nameParts = fullName.trim().split(' ');
              firstName = nameParts[0] || '';
              lastName = nameParts.slice(1).join(' ') || '';
            } else {
              firstName = authUser.email?.split('@')[0] || 'User';
            }
            
            // Create a basic profile for the user
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                user_id: authUser.id,
                email: authUser.email || '',
                role: 'member',
                first_name: firstName,
                last_name: lastName,
                avatar_url: avatarUrl || null,
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

    // Get initial session
    const getInitialSession = async () => {
      console.log('Getting initial session...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setLoading(false);
          return;
        }
        
        console.log('Session check:', session ? 'User logged in' : 'No session');
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Exception getting session:', error);
        setUser(null);
      } finally {
        console.log('Auth check complete');
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    if (!supabase) {
      console.warn('Supabase client not available for sign out');
      setUser(null);
      return;
    }
    
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
    supabase,
  };
}

// Hook for protecting routes
export function useRequireAuth(requiredRole?: UserRole) {
  const { user, loading, canAccess } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        window.location.href = '/login';
        return;
      }

      if (requiredRole && !canAccess(requiredRole)) {
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
      if (!user?.profile || !supabase) {
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
