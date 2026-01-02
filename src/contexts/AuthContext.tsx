'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode, useRef } from 'react';
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
  refreshSession: () => Promise<boolean>;
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

// Helper to check if error is JWT expired
const isJWTExpiredError = (error: any): boolean => {
  if (!error) return false;
  const message = error.message || error.error_description || String(error);
  return message.toLowerCase().includes('jwt') && 
         (message.toLowerCase().includes('expired') || message.toLowerCase().includes('invalid'));
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.LOADING);
  const [isInitialized, setIsInitialized] = useState(false);
  const refreshingRef = useRef(false);
  const lastRefreshRef = useRef<number>(0);
  const networkErrorLoggedRef = useRef(false); // Track if we've already logged network error
  
  // Refs to hold callback functions for use in effects without causing re-runs
  const setAuthenticatedUserRef = useRef<((authUser: User, currentSession: Session) => Promise<void>) | null>(null);
  const clearAuthStateRef = useRef<(() => void) | null>(null);

  // Create supabase client once with memoization
  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return null;
    }
  }, []);

  // Refresh session - returns true if successful
  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!supabase) return false;
    
    // Prevent concurrent refresh calls
    if (refreshingRef.current) {
      // Wait for ongoing refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      return session !== null;
    }

    // Rate limit refreshes (min 5 seconds between refreshes)
    const now = Date.now();
    if (now - lastRefreshRef.current < 5000) {
      return session !== null;
    }

    refreshingRef.current = true;
    lastRefreshRef.current = now;

    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.warn('Session refresh failed:', error.message);
        refreshingRef.current = false;
        return false;
      }

      if (refreshedSession?.user) {
        setSession(refreshedSession);
        refreshingRef.current = false;
        return true;
      }
      
      refreshingRef.current = false;
      return false;
    } catch (error) {
      console.error('Error refreshing session:', error);
      refreshingRef.current = false;
      return false;
    }
  }, [supabase, session]);

  // Load user profile from database with JWT retry and network error handling
  const loadUserProfile = useCallback(async (authUser: User, retryCount = 0): Promise<Profile | null> => {
    if (!supabase) return null;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (error) {
        // Handle JWT expired - try to refresh and retry
        if (isJWTExpiredError(error) && retryCount < 2) {
          console.log('JWT expired while loading profile, refreshing token...');
          const refreshed = await refreshSession();
          if (refreshed) {
            // Retry with new token
            return loadUserProfile(authUser, retryCount + 1);
          } else {
            // Refresh failed - user needs to re-login
            return null;
          }
        }

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
            // Handle JWT expired on insert
            if (isJWTExpiredError(createError) && retryCount < 2) {
              const refreshed = await refreshSession();
              if (refreshed) {
                return loadUserProfile(authUser, retryCount + 1);
              }
            }
            console.error('Error creating profile:', createError.message);
            return null;
          }
          
          return newProfile;
        }
        
        // Don't log JWT expired errors as they're handled
        if (!isJWTExpiredError(error)) {
          // Only log network errors once to prevent spam
          if (error?.message?.includes('NetworkError') || error?.message?.includes('Failed to fetch')) {
            if (!networkErrorLoggedRef.current) {
              console.warn('Network error loading profile - check your connection');
              networkErrorLoggedRef.current = true;
            }
          } else {
            console.error('Error loading profile:', error.message);
          }
        }
        return null;
      }

      // Reset network error flag on successful load
      networkErrorLoggedRef.current = false;
      return profile;
    } catch (error: any) {
      // Handle network errors gracefully - only log once
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
        if (!networkErrorLoggedRef.current) {
          console.warn('Network error loading profile, will retry on reconnect');
          networkErrorLoggedRef.current = true;
        }
        // Return null but don't clear auth - allow retry on network restore
        return null;
      }
      
      if (isJWTExpiredError(error) && retryCount < 2) {
        const refreshed = await refreshSession();
        if (refreshed) {
          return loadUserProfile(authUser, retryCount + 1);
        }
      }
      console.error('Exception loading profile:', error);
      return null;
    }
  }, [supabase, refreshSession]);

  // Set authenticated user state
  const setAuthenticatedUser = useCallback(async (authUser: User, currentSession: Session) => {
    setSession(currentSession);
    
    let profile = await loadUserProfile(authUser);
    
    // If profile load failed (likely network error), retry once after a delay
    if (!profile) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      profile = await loadUserProfile(authUser);
    }
    
    setUser({
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata,
      profile,
    });
    setStatus(AuthStatus.AUTHENTICATED);
  }, [loadUserProfile]);

  // Clear auth state
  const clearAuthState = useCallback(() => {
    setUser(null);
    setSession(null);
    setStatus(AuthStatus.UNAUTHENTICATED);
  }, []);

  // Keep refs updated with latest callback functions
  useEffect(() => {
    setAuthenticatedUserRef.current = setAuthenticatedUser;
    clearAuthStateRef.current = clearAuthState;
  }, [setAuthenticatedUser, clearAuthState]);

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

  // Initialize auth state (runs once)
  useEffect(() => {
    if (!supabase || isInitialized) return;

    let mounted = true;
    
    // Safety timeout - don't stay in loading state forever (reduced to 5 seconds for better mobile experience)
    const safetyTimeout = setTimeout(() => {
      if (mounted && status === AuthStatus.LOADING) {
        console.warn('Auth initialization timed out after 5s, setting unauthenticated');
        clearAuthState();
        setIsInitialized(true);
      }
    }, 5000);

    const initializeAuth = async () => {
      try {
        // Get initial session - this checks cookies and refreshes if needed
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          // If JWT expired, try to refresh
          if (isJWTExpiredError(error)) {
            console.log('Initial session JWT expired, attempting refresh...');
            const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
            if (refreshedSession?.user) {
              await setAuthenticatedUser(refreshedSession.user, refreshedSession);
              setIsInitialized(true);
              clearTimeout(safetyTimeout);
              return;
            }
          }
          console.error('Error getting initial session:', error);
          clearAuthState();
          setIsInitialized(true);
          clearTimeout(safetyTimeout);
          return;
        }

        if (initialSession?.user) {
          await setAuthenticatedUser(initialSession.user, initialSession);
        } else {
          clearAuthState();
        }
        
        setIsInitialized(true);
        clearTimeout(safetyTimeout);
      } catch (error: any) {
        console.error('Exception initializing auth:', error);
        if (mounted) {
          // Try refresh on any error
          if (isJWTExpiredError(error)) {
            try {
              const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
              if (refreshedSession?.user) {
                await setAuthenticatedUser(refreshedSession.user, refreshedSession);
                setIsInitialized(true);
                clearTimeout(safetyTimeout);
                return;
              }
            } catch {
              // Refresh failed
            }
          }
          clearAuthState();
          setIsInitialized(true);
          clearTimeout(safetyTimeout);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
    };
  }, [supabase, setAuthenticatedUser, clearAuthState, isInitialized]);

  // Set up auth state change listener (separate from initialization)
  // Uses refs to avoid re-creating the listener when callbacks change
  useEffect(() => {
    if (!supabase || !isInitialized) return; // Wait for initialization to complete

    let mounted = true;
    let isProcessing = false; // Prevent concurrent processing

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession: Session | null) => {
        if (!mounted || isProcessing) return;
        
        // Skip INITIAL_SESSION as it's already handled in initializeAuth
        if (event === 'INITIAL_SESSION') return;

        isProcessing = true;

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            // Only process if we don't already have a user
            if (currentSession?.user && setAuthenticatedUserRef.current && !user) {
              await setAuthenticatedUserRef.current(currentSession.user, currentSession);
            }
            break;

          case 'TOKEN_REFRESHED':
            // Just update the session, don't re-fetch profile
            if (currentSession) {
              setSession(currentSession);
            }
            break;

          case 'SIGNED_OUT':
            if (clearAuthStateRef.current) {
              clearAuthStateRef.current();
            }
            break;

          case 'USER_UPDATED':
            if (currentSession?.user && setAuthenticatedUserRef.current) {
              await setAuthenticatedUserRef.current(currentSession.user, currentSession);
            }
            break;

          default:
            // For any other events, only sync if there's a mismatch
            if (currentSession?.user && !user && setAuthenticatedUserRef.current) {
              await setAuthenticatedUserRef.current(currentSession.user, currentSession);
            } else if (!currentSession && user && clearAuthStateRef.current) {
              clearAuthStateRef.current();
            }
        }
        
        isProcessing = false;
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, isInitialized, user]); // Added user to prevent duplicate SIGNED_IN handling

  // Proactive token refresh (minimal - let Supabase handle most of it)
  useEffect(() => {
    if (!supabase || !isInitialized) return;

    let mounted = true;
    let lastRefresh = Date.now();

    // Proactive token refresh - check every 5 minutes
    const refreshInterval = setInterval(async () => {
      if (!mounted) return;

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.expires_at) {
          const timeUntilExpiry = (currentSession.expires_at * 1000) - Date.now();
          
          // Only refresh if expiring within 5 minutes
          if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
            await supabase.auth.refreshSession();
          }
        }
      } catch (error) {
        // Silent fail
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    // Handle visibility change - only refresh if been away for a while
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && mounted) {
        const timeSinceLastRefresh = Date.now() - lastRefresh;
        
        // Only refresh if we've been away for more than 1 minute
        if (timeSinceLastRefresh > 60 * 1000) {
          try {
            await supabase.auth.refreshSession();
            lastRefresh = Date.now();
          } catch (error) {
            // Silent fail
          }
        }
      }
    };

    // Handle network reconnection - reload profile if it was missing
    const handleOnline = async () => {
      if (!mounted) return;
      
      // If we have a session but no profile, try to reload it
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user && setAuthenticatedUserRef.current) {
        // Reset network error flag so new errors can be logged
        networkErrorLoggedRef.current = false;
        console.log('Network restored, reloading user profile...');
        await setAuthenticatedUserRef.current(currentSession.user, currentSession);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [supabase, isInitialized]);

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
