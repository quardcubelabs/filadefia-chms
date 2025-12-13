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
          let memberData = null;

          // Try to find member record by name first
          const { data: memberByName, error: nameError } = await supabase
            .from('members')
            .select('id, first_name, last_name, email')
            .eq('first_name', user.profile.first_name)
            .eq('last_name', user.profile.last_name)
            .maybeSingle();

          if (memberByName) {
            memberData = memberByName;
          } else if (user.email) {
            // If no match by name, try by email
            const { data: memberByEmail, error: emailError } = await supabase
              .from('members')
              .select('id, first_name, last_name, email')
              .eq('email', user.email)
              .maybeSingle();

            if (memberByEmail) {
              memberData = memberByEmail;
            }
          }

          if (!memberData) {
            console.log('No member record found for department leader:', {
              profileName: `${user.profile.first_name} ${user.profile.last_name}`,
              email: user.email
            });
            setLoading(false);
            return;
          }

          // Now find the department where this member is the leader
          const { data: departmentData, error: deptError } = await supabase
            .from('departments')
            .select('id, name, leader_id')
            .eq('leader_id', memberData.id)
            .eq('is_active', true)
            .maybeSingle();

          if (!departmentData || deptError) {
            console.log('No department found for member leader:', {
              memberId: memberData.id,
              memberName: `${memberData.first_name} ${memberData.last_name}`,
              error: deptError
            });
            setLoading(false);
            return;
          }

          console.log('✅ Found department for leader:', {
            memberName: `${memberData.first_name} ${memberData.last_name}`,
            memberId: memberData.id,
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