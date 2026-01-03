import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types';

export const auth = {
  // Sign up new user
  signUp: async (email: string, password: string, profile: {
    firstName: string;
    lastName: string;
    phone: string;
    role?: UserRole;
  }) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          role: profile.role || 'member',
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Signup failed' };
    }
  },

  // Sign in user
  signIn: async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  },

  // Sign out user
  signOut: async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Logout failed');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Logout failed' };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    const supabase = createClient();
    
    if (!supabase) {
      console.warn('Supabase client not available');
      return null;
    }
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      if (!user) return null;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      return {
        id: user.id,
        email: user.email,
        profile,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Check user permissions
  hasPermission: (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
    // Admin has all permissions
    if (userRole === 'administrator') return true;
    
    // Pastor has most permissions except full admin
    if (userRole === 'pastor' && requiredRoles.includes('pastor')) return true;
    
    // Check if user role is in required roles
    return requiredRoles.includes(userRole);
  },

  // Role hierarchy for permission checking
  getRoleLevel: (role: UserRole): number => {
    const levels: Record<UserRole, number> = {
      member: 1,
      zone_leader: 2,
      department_leader: 2,
      secretary: 3,
      treasurer: 3,
      pastor: 4,
      administrator: 5,
    };
    return levels[role] || 0;
  },

  // Check if user can access resource
  canAccess: (userRole: UserRole, minimumRole: UserRole): boolean => {
    return auth.getRoleLevel(userRole) >= auth.getRoleLevel(minimumRole);
  },
};