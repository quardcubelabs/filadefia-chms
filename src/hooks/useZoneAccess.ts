'use client';

import { useAuth } from './useAuth';
import { useState, useEffect, useRef } from 'react';

export interface ZoneAccess {
  zoneId: string | null;
  zoneName: string | null;
  isZoneLeader: boolean;
  isAdminOrPastor: boolean;
  canAccessAllZones: boolean;
  loading: boolean;
}

export function useZoneAccess(): ZoneAccess {
  const { user, supabase } = useAuth();
  const [zoneInfo, setZoneInfo] = useState<{
    id: string | null;
    name: string | null;
  }>({ id: null, name: null });
  const [loading, setLoading] = useState(true);
  
  // Prevent SSR execution
  const [mounted, setMounted] = useState(false);
  
  // Prevent duplicate fetches
  const hasFetchedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const loadZoneAccess = async () => {
      if (!user?.profile || !supabase) {
        setLoading(false);
        return;
      }

      // Prevent duplicate fetches for same user
      if (hasFetchedRef.current && lastUserIdRef.current === user.id) {
        return;
      }

      try {
        // If user is administrator or pastor, they can access everything
        if (['administrator', 'pastor'].includes(user.profile.role)) {
          console.log('✅ Admin/Pastor user - full zone access');
          setZoneInfo({ id: null, name: null });
          setLoading(false);
          hasFetchedRef.current = true;
          lastUserIdRef.current = user.id;
          return;
        }

        // Check if user is a zone leader via role
        if (user.profile.role === 'zone_leader') {
          console.log('🔍 User is zone_leader role, checking zone_profiles...');
          
          // Check zone_profiles table first
          const { data: zoneProfileData } = await supabase
            .from('zone_profiles')
            .select(`
              zone_id,
              zones (
                id,
                name
              )
            `)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (zoneProfileData?.zones) {
            const zone = zoneProfileData.zones as any;
            console.log('✅ Found zone via zone_profiles:', {
              zoneId: zone.id,
              zoneName: zone.name
            });
            setZoneInfo({
              id: zone.id,
              name: zone.name
            });
            hasFetchedRef.current = true;
            lastUserIdRef.current = user.id;
            setLoading(false);
            return;
          }
        }

        // Check if user is a zone leader via member lookup
        console.log('🔍 Checking zone leadership via member lookup for user:', {
          email: user.email,
          userId: user.id
        });

        // First find the member record for this user
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id, first_name, last_name, email')
          .eq('email', user.email)
          .maybeSingle();

        if (memberError || !memberData) {
          console.log('❌ No member record found for zone check');
          hasFetchedRef.current = true;
          lastUserIdRef.current = user.id;
          setLoading(false);
          return;
        }

        // Check if this member is a zone leader via zone_members
        const { data: zoneLeaderData } = await supabase
          .from('zone_members')
          .select(`
            id,
            position,
            zone_id,
            zones (
              id,
              name,
              swahili_name
            )
          `)
          .eq('member_id', memberData.id)
          .eq('position', 'leader')
          .eq('is_active', true)
          .maybeSingle();

        if (zoneLeaderData?.zones) {
          const zone = zoneLeaderData.zones as any;
          console.log('✅ Found zone leadership via zone_members:', {
            zoneId: zone.id,
            zoneName: zone.name
          });

          setZoneInfo({
            id: zone.id,
            name: zone.name
          });
        } else {
          // Also check if user is set as leader_id on the zone
          const { data: zoneData } = await supabase
            .from('zones')
            .select('id, name')
            .eq('leader_id', memberData.id)
            .eq('is_active', true)
            .maybeSingle();

          if (zoneData) {
            console.log('✅ Found zone via leader_id:', {
              zoneId: zoneData.id,
              zoneName: zoneData.name
            });

            setZoneInfo({
              id: zoneData.id,
              name: zoneData.name
            });
          } else {
            console.log('ℹ️ User is not a zone leader');
          }
        }

        hasFetchedRef.current = true;
        lastUserIdRef.current = user.id;

      } catch (error) {
        console.error('💥 Error in zone access check:', error);
      } finally {
        setLoading(false);
      }
    };

    loadZoneAccess();
  }, [user?.id, user?.profile?.role, user?.email, supabase, mounted]);

  const userRole = user?.profile?.role || '';
  const isAdminOrPastor = ['administrator', 'pastor'].includes(userRole);
  const isZoneLeader = zoneInfo.id !== null || userRole === 'zone_leader';

  return {
    zoneId: zoneInfo.id,
    zoneName: zoneInfo.name,
    isZoneLeader,
    isAdminOrPastor,
    canAccessAllZones: isAdminOrPastor,
    loading
  };
}
