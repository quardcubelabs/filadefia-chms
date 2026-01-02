'use client';

import { useAuth, AuthStatus } from './useAuth';
import { useState, useEffect, useRef } from 'react';

export interface DepartmentAccess {
  departmentId: string | null;
  departmentName: string | null;
  isDepartmentLeader: boolean;
  isAdminOrPastor: boolean;
  canAccessAllDepartments: boolean;
  loading: boolean;
}

export function useDepartmentAccess(): DepartmentAccess {
  const { user, supabase, status } = useAuth();
  const [departmentInfo, setDepartmentInfo] = useState<{
    id: string | null;
    name: string | null;
  }>({ id: null, name: null });
  const [loading, setLoading] = useState(true);
  
  // Prevent duplicate fetches
  const hasFetchedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // If auth status is definitively unauthenticated, stop loading immediately
    if (status === AuthStatus.UNAUTHENTICATED) {
      setLoading(false);
      return;
    }

    const loadDepartmentAccess = async () => {
      // Skip if no user or supabase
      if (!user || !supabase) {
        setLoading(false);
        return;
      }
      
      // If profile is still loading (null but user exists), wait a bit then proceed
      // This prevents infinite loading on slow networks
      if (!user.profile) {
        // Set a timeout to stop waiting for profile after 5 seconds
        const timeoutId = setTimeout(() => {
          setLoading(false);
        }, 5000);
        
        return () => clearTimeout(timeoutId);
      }
      
      // Prevent duplicate fetches for same user
      if (hasFetchedRef.current && lastUserIdRef.current === user.id) {
        return;
      }

      try {
        // If user is administrator or pastor, they can access everything
        if (['administrator', 'pastor'].includes(user.profile.role)) {
          setDepartmentInfo({ id: null, name: null });
          setLoading(false);
          hasFetchedRef.current = true;
          lastUserIdRef.current = user.id;
          return;
        }

        // If user is department leader, find their department
        if (user.profile.role === 'department_leader') {
          // Direct lookup using leader_user_id
          const { data: departmentData } = await supabase
            .from('departments')
            .select('id, name, leader_user_id')
            .eq('leader_user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (departmentData) {
            setDepartmentInfo({ 
              id: departmentData.id, 
              name: departmentData.name 
            });
          } else {
            // Fallback: Try old structure
            const { data: memberData } = await supabase
              .from('members')
              .select('id')
              .eq('email', user.email)
              .maybeSingle();

            if (memberData) {
              const { data: oldDeptData } = await supabase
                .from('departments')
                .select('id, name')
                .eq('leader_id', memberData.id)
                .eq('is_active', true)
                .maybeSingle();

              if (oldDeptData) {
                setDepartmentInfo({ 
                  id: oldDeptData.id, 
                  name: oldDeptData.name 
                });
              }
            }
          }
        }

        // If user is regular member, check if they belong to a department
        if (user.profile.role === 'member') {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('department_id')
            .eq('user_id', user.id)
            .single();

          if (profileData?.department_id) {
            const { data: deptData } = await supabase
              .from('departments')
              .select('id, name')
              .eq('id', profileData.department_id)
              .eq('is_active', true)
              .single();

            if (deptData) {
              setDepartmentInfo({ 
                id: deptData.id, 
                name: deptData.name 
              });
            }
          }
        }
        
        hasFetchedRef.current = true;
        lastUserIdRef.current = user.id;

      } catch (error) {
        console.error('Error in department access check:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDepartmentAccess();
  }, [user?.id, user?.profile?.role, user?.email, supabase]);

  return {
    departmentId: departmentInfo.id,
    departmentName: departmentInfo.name,
    isDepartmentLeader: user?.profile?.role === 'department_leader',
    isAdminOrPastor: ['administrator', 'pastor'].includes(user?.profile?.role || ''),
    canAccessAllDepartments: ['administrator', 'pastor', 'treasurer', 'secretary'].includes(user?.profile?.role || ''),
    loading
  };
}