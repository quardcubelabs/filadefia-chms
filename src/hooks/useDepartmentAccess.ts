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
          console.log('✅ Admin/Pastor user - full access');
          setDepartmentInfo({ id: null, name: null });
          setLoading(false);
          return;
        }

        // If user is department leader, find their department using NEW SIMPLIFIED APPROACH
        if (user.profile.role === 'department_leader') {
          console.log('🔍 SIMPLIFIED DEPARTMENT ACCESS - Department Leader:', {
            role: user.profile.role,
            profileName: `${user.profile.first_name} ${user.profile.last_name}`,
            email: user.email,
            userId: user.id
          });

          // NEW: Direct lookup using leader_user_id (after database migration)
          const { data: departmentData, error: deptError } = await supabase
            .from('departments')
            .select('id, name, leader_user_id')
            .eq('leader_user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          console.log('🔍 Direct department lookup by leader_user_id:', {
            userId: user.id,
            found: !!departmentData,
            departmentData,
            error: deptError
          });

          if (departmentData) {
            console.log('✅ Found department via new structure:', {
              departmentId: departmentData.id,
              departmentName: departmentData.name,
              dashboardUrl: `/departments/${departmentData.id}`
            });

            setDepartmentInfo({ 
              id: departmentData.id, 
              name: departmentData.name 
            });
          } else {
            console.log('⚠️ No department found with new structure, trying fallback to old structure...');
            
            // FALLBACK: Try old structure (departments.leader_id -> members.id)
            const { data: memberData, error: memberError } = await supabase
              .from('members')
              .select('id, first_name, last_name, email')
              .eq('email', user.email)
              .maybeSingle();

            if (memberData) {
              const { data: oldDeptData, error: oldDeptError } = await supabase
                .from('departments')
                .select('id, name, leader_id')
                .eq('leader_id', memberData.id)
                .eq('is_active', true)
                .maybeSingle();

              if (oldDeptData) {
                console.log('⚠️ Found department via old structure - database migration needed:', {
                  memberId: memberData.id,
                  departmentId: oldDeptData.id,
                  departmentName: oldDeptData.name
                });

                setDepartmentInfo({ 
                  id: oldDeptData.id, 
                  name: oldDeptData.name 
                });
              } else {
                console.log('❌ No department found in old structure either');
              }
            } else {
              console.log('❌ No matching member record found');
            }
          }
        }

        // If user is regular member, check if they belong to a department
        if (user.profile.role === 'member') {
          // Check if profile has department_id (after database migration)
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('department_id')
            .eq('user_id', user.id)
            .single();

          if (profileData?.department_id) {
            const { data: deptData, error: deptErr } = await supabase
              .from('departments')
              .select('id, name')
              .eq('id', profileData.department_id)
              .eq('is_active', true)
              .single();

            if (deptData && !deptErr) {
              console.log('ℹ️ Member belongs to department:', deptData.name);
              setDepartmentInfo({ 
                id: deptData.id, 
                name: deptData.name 
              });
            }
          }
        }

      } catch (error) {
        console.error('💥 Error in department access check:', error);
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