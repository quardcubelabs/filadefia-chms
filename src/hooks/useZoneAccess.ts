'use client';

import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';

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

      try {
        // If user is administrator or pastor, they can access everything
        if (['administrator', 'pastor'].includes(user.profile.role)) {
          console.log('✅ Admin/Pastor user - full zone access');
          setZoneInfo({ id: null, name: null });
          setLoading(false);
          return;
        }

        // Check if user is a zone leader
        console.log('🔍 Checking zone leadership for user:', {
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
          setLoading(false);
          return;
        }

        // Check if this member is a zone leader
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
          console.log('✅ Found zone leadership:', {
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

      } catch (error) {
        console.error('💥 Error in zone access check:', error);
      } finally {
        setLoading(false);
      }
    };

    loadZoneAccess();
  }, [user, supabase, mounted]);

  const userRole = user?.profile?.role || '';
  const isAdminOrPastor = ['administrator', 'pastor'].includes(userRole);
  const isZoneLeader = zoneInfo.id !== null;

  return {
    zoneId: zoneInfo.id,
    zoneName: zoneInfo.name,
    isZoneLeader,
    isAdminOrPastor,
    canAccessAllZones: isAdminOrPastor,
    loading
  };
}
