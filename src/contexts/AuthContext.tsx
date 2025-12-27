'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, UserRole } from '@/types';
import type { User, Session, SupabaseClient, AuthChangeEvent } from '@supabase/supabase-js';

// Auth state enum for clear state management
export enum AuthStatus {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
}

export interface AuthUser {
  id: string;
  email: string | undefined;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
    name?: string;
    [key: string]: unknown;
  };
  profile: Profile | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  status: AuthStatus;
  loading: boolean;
  supabase: SupabaseClient | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hasRole: (requiredRoles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isPastor: () => boolean;
  isStaff: () => boolean;
  isDepartmentLeader: () => boolean;
  canAccess: (minimumRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.LOADING);
  const [isInitialized, setIsInitialized] = useState(false);

  // Create supabase client once with memoization
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return null;
    }
  }, []);

  // Load user profile from database
  const loadUserProfile = useCallback(async (authUser: User): Promise<Profile | null> => {
    if (!supabase) return null;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (error) {
        // Profile doesn't exist - create one
        if (error.code === 'PGRST116') {
          const fullName = authUser.user_metadata?.full_name || '';
          const avatarUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '';
          
          let firstName = '';
          let lastName = '';
          
          if (fullName) {
            const nameParts = fullName.trim().split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          } else {
            firstName = authUser.email?.split('@')[0] || 'User';
          }

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
            return null;
          }
          
          return newProfile;
        }
        
        console.error('Error loading profile:', error.message);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Exception loading profile:', error);
      return null;
    }
  }, [supabase]);

  // Set authenticated user state
  const setAuthenticatedUser = useCallback(async (authUser: User, currentSession: Session) => {
    const profile = await loadUserProfile(authUser);
    
    setUser({
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata,
      profile,
    });
    setSession(currentSession);
    setStatus(AuthStatus.AUTHENTICATED);
  }, [loadUserProfile]);

  // Clear auth state
  const clearAuthState = useCallback(() => {
    setUser(null);
    setSession(null);
    setStatus(AuthStatus.UNAUTHENTICATED);
  }, []);

  // Refresh session manually
  const refreshSession = useCallback(async () => {
    if (!supabase) return;

    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      
      if (error || !refreshedSession) {
        console.warn('Session refresh failed:', error?.message);
        clearAuthState();
        return;
      }

      if (refreshedSession.user) {
        await setAuthenticatedUser(refreshedSession.user, refreshedSession);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  }, [supabase, setAuthenticatedUser, clearAuthState]);

  // Sign out
  const signOut = useCallback(async () => {
    if (!supabase) {
      clearAuthState();
      return;
    }

    try {
      // Clear state first to prevent race conditions
      clearAuthState();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [supabase, clearAuthState]);

  // Initialize auth state
  useEffect(() => {
    if (!supabase || isInitialized) return;

    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session - this checks cookies and refreshes if needed
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Error getting initial session:', error);
          clearAuthState();
          setIsInitialized(true);
          return;
        }

        if (initialSession?.user) {
          await setAuthenticatedUser(initialSession.user, initialSession);
        } else {
          clearAuthState();
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Exception initializing auth:', error);
        if (mounted) {
          clearAuthState();
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        if (!mounted) return;

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            if (currentSession?.user) {
              await setAuthenticatedUser(currentSession.user, currentSession);
            }
            break;

          case 'SIGNED_OUT':
            clearAuthState();
            break;

          case 'USER_UPDATED':
            if (currentSession?.user) {
              await setAuthenticatedUser(currentSession.user, currentSession);
            }
            break;

          case 'INITIAL_SESSION':
            // Already handled in initializeAuth
            break;

          default:
            // For any other events, sync state with session
            if (currentSession?.user) {
              await setAuthenticatedUser(currentSession.user, currentSession);
            } else if (isInitialized) {
              clearAuthState();
            }
        }
      }
    );

    // Proactive token refresh - check every 4 minutes
    const refreshInterval = setInterval(async () => {
      if (!mounted) return;

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.expires_at) {
          const timeUntilExpiry = (currentSession.expires_at * 1000) - Date.now();
          // Refresh if expiring within 5 minutes
          if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
            await supabase.auth.refreshSession();
          }
        }
      } catch (error) {
        // Silent fail - don't disrupt user experience
      }
    }, 4 * 60 * 1000); // 4 minutes

    // Handle visibility change - refresh on tab focus
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && mounted) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession?.user) {
            // Session exists, ensure state is synced
            if (!user || user.id !== currentSession.user.id) {
              await setAuthenticatedUser(currentSession.user, currentSession);
            }
          } else if (user) {
            // No session but we have user state - clear it
            clearAuthState();
          }
        } catch (error) {
          // Silent fail
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [supabase, isInitialized, setAuthenticatedUser, clearAuthState, user]);

  // Role checking functions
  const hasRole = useCallback((requiredRoles: UserRole[]): boolean => {
    if (!user?.profile) return false;
    return requiredRoles.includes(user.profile.role);
  }, [user]);

  const isAdmin = useCallback((): boolean => {
    return user?.profile?.role === 'administrator';
  }, [user]);

  const isPastor = useCallback((): boolean => {
    return user?.profile?.role === 'pastor';
  }, [user]);

  const isStaff = useCallback((): boolean => {
    return hasRole(['administrator', 'pastor', 'secretary', 'treasurer']);
  }, [hasRole]);

  const isDepartmentLeader = useCallback((): boolean => {
    return user?.profile?.role === 'department_leader';
  }, [user]);

  const canAccess = useCallback((minimumRole: UserRole): boolean => {
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
  }, [user]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    session,
    status,
    loading: status === AuthStatus.LOADING,
    supabase,
    signOut,
    refreshSession,
    hasRole,
    isAdmin,
    isPastor,
    isStaff,
    isDepartmentLeader,
    canAccess,
  }), [
    user,
    session,
    status,
    supabase,
    signOut,
    refreshSession,
    hasRole,
    isAdmin,
    isPastor,
    isStaff,
    isDepartmentLeader,
    canAccess,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuthContext() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}

// Export alias for backward compatibility
export { useAuthContext as useAuth };
