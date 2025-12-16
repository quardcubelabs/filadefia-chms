'use client';

import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';

export interface DepartmentAccess {
  departmentId: string | null;
  departmentName: string | null;
  isDepartmentLeader: boolean;
  isAdminOrPastor: boolean;
  canAccessAllDepartments: boolean;
  loading: boolean;
}

export function useDepartmentAccess(): DepartmentAccess {
  const { user, supabase } = useAuth();
  const [departmentInfo, setDepartmentInfo] = useState<{
    id: string | null;
    name: string | null;
  }>({ id: null, name: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDepartmentAccess = async () => {
      if (!user?.profile || !supabase) {
        setLoading(false);
        return;
      }

      try {
        // If user is administrator or pastor, they can access everything
        if (['administrator', 'pastor'].includes(user.profile.role)) {
          setDepartmentInfo({ id: null, name: null });
          setLoading(false);
          return;
        }

        // If user is department leader, find their department
        if (user.profile.role === 'department_leader') {
          console.log('🔍 DEPARTMENT ACCESS DEBUG - Department Leader Detected:', {
            role: user.profile.role,
            profileName: `${user.profile.first_name} ${user.profile.last_name}`,
            email: user.email,
            userId: user.id
          });

          // Option 1: Try to find department by user_id (if departments.leader_id references profiles.user_id)
          let departmentData = null;
          const { data: deptByUserId, error: userIdError } = await supabase
            .from('departments')
            .select('id, name, leader_id')
            .eq('leader_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          console.log('🔍 Department search by user ID:', {
            userId: user.id,
            found: !!deptByUserId,
            departmentData: deptByUserId,
            error: userIdError
          });

          if (deptByUserId) {
            departmentData = deptByUserId;
          } else {
            // Option 2: Find member record and then department (fallback to old method)
            const { data: memberData, error: memberError } = await supabase
              .from('members')
              .select('id, first_name, last_name, email')
              .eq('email', user.email)
              .maybeSingle();

            console.log('🔍 Fallback member search:', {
              email: user.email,
              found: !!memberData,
              memberData,
              error: memberError
            });

            if (memberData) {
              const { data: deptByMemberId, error: memberDeptError } = await supabase
                .from('departments')
                .select('id, name, leader_id')
                .eq('leader_id', memberData.id)
                .eq('is_active', true)
                .maybeSingle();

              console.log('🔍 Department search by member ID:', {
                memberId: memberData.id,
                found: !!deptByMemberId,
                departmentData: deptByMemberId,
                error: memberDeptError
              });

              departmentData = deptByMemberId;
            }
          }

          if (!departmentData) {
            console.log('❌ No department found for department leader:', {
              userId: user.id,
              email: user.email,
              profileName: `${user.profile.first_name} ${user.profile.last_name}`,
              searchedByUserId: !!deptByUserId,
              triedFallbackMethod: true
            });
            setLoading(false);
            return;
          }

          console.log('✅ Found department for leader:', {
            userId: user.id,
            email: user.email,
            departmentId: departmentData.id,
            departmentName: departmentData.name,
            dashboardUrl: `/departments/${departmentData.id}`
          });

          setDepartmentInfo({ 
            id: departmentData.id, 
            name: departmentData.name 
          });
        }
      } catch (error) {
        console.error('Error in department access:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDepartmentAccess();
  }, [user?.profile, supabase]);

  return {
    departmentId: departmentInfo.id,
    departmentName: departmentInfo.name,
    isDepartmentLeader: user?.profile?.role === 'department_leader',
    isAdminOrPastor: ['administrator', 'pastor'].includes(user?.profile?.role || ''),
    canAccessAllDepartments: ['administrator', 'pastor', 'treasurer', 'secretary'].includes(user?.profile?.role || ''),
    loading
  };
}