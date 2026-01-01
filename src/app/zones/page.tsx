'use client';

// Prevent SSR/prerendering issues during build
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/MainLayout';
import { 
  Users, MapPin, UserCheck, TrendingUp, 
  Plus, Edit, Trash2, X
} from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  swahili_name?: string;
  description?: string;
  leader_id?: string;
  is_active: boolean;
  created_at: string;
}

interface ZoneStats {
  id: string;
  name: string;
  swahili_name?: string;
  description?: string;
  member_count: number;
  leader_name?: string;
  color: string;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export default function ZonesPage() {
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  const [zones, setZones] = useState<ZoneStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneStats | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    swahili_name: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user && supabase) {
      fetchZones();
    }
  }, [authLoading, user, supabase]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Fetch zones
      const { data: zonesList, error: zonesError } = await supabase
        .from('zones')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (zonesError) throw zonesError;

      // Fetch member counts for each zone
      const zonesWithStats: ZoneStats[] = await Promise.all(
        (zonesList || []).map(async (zone: Zone, index: number) => {
          const { count } = await supabase
            .from('zone_members')
            .select('*', { count: 'exact', head: true })
            .eq('zone_id', zone.id)
            .eq('is_active', true);

          // Get leader name if exists
          let leaderName = undefined;
          if (zone.leader_id) {
            const { data: leader } = await supabase
              .from('members')
              .select('first_name, last_name')
              .eq('id', zone.leader_id)
              .single();
            if (leader) {
              leaderName = `${leader.first_name} ${leader.last_name}`;
            }
          }

          return {
            ...zone,
            member_count: count || 0,
            leader_name: leaderName,
            color: getZoneColor(index),
          };
        })
      );

      setZones(zonesWithStats);

    } catch (err: any) {
      console.error('Error fetching zones:', err);
      setError(err.message || 'Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  const getZoneColor = (index: number) => {
    const colors = [
      'from-blue-500 to-blue-700',
      'from-green-500 to-green-700',
      'from-purple-500 to-purple-700',
      'from-orange-500 to-orange-700',
      'from-pink-500 to-pink-700',
      'from-teal-500 to-teal-700',
      'from-indigo-500 to-indigo-700',
      'from-red-500 to-red-700',
      'from-emerald-500 to-emerald-700',
      'from-cyan-500 to-cyan-700',
    ];
    return colors[index % colors.length];
  };

  const handleAddZone = async () => {
    if (!formData.name.trim()) {
      setError('Zone name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const { error: insertError } = await supabase!
        .from('zones')
        .insert({
          name: formData.name.trim(),
          swahili_name: formData.swahili_name.trim() || null,
          description: formData.description.trim() || null,
          is_active: true
        });

      if (insertError) throw insertError;

      setShowAddModal(false);
      setFormData({ name: '', swahili_name: '', description: '' });
      fetchZones();
    } catch (err: any) {
      console.error('Error adding zone:', err);
      setError(err.message || 'Failed to add zone');
    } finally {
      setSaving(false);
    }
  };

  const handleEditZone = async () => {
    if (!selectedZone || !formData.name.trim()) {
      setError('Zone name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase!
        .from('zones')
        .update({
          name: formData.name.trim(),
          swahili_name: formData.swahili_name.trim() || null,
          description: formData.description.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedZone.id);

      if (updateError) throw updateError;

      setShowEditModal(false);
      setSelectedZone(null);
      setFormData({ name: '', swahili_name: '', description: '' });
      fetchZones();
    } catch (err: any) {
      console.error('Error updating zone:', err);
      setError(err.message || 'Failed to update zone');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm('Are you sure you want to delete this zone? This will also remove all member assignments.')) {
      return;
    }

    try {
      setError(null);

      const { error: deleteError } = await supabase!
        .from('zones')
        .update({ is_active: false })
        .eq('id', zoneId);

      if (deleteError) throw deleteError;

      fetchZones();
    } catch (err: any) {
      console.error('Error deleting zone:', err);
      setError(err.message || 'Failed to delete zone');
    }
  };

  const openEditModal = (zone: ZoneStats) => {
    setSelectedZone(zone);
    setFormData({
      name: zone.name,
      swahili_name: zone.swahili_name || '',
      description: zone.description || ''
    });
    setShowEditModal(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
              <MapPin className="w-5 h-5 md:w-6 md:h-6 mr-2 text-blue-600" />
              Church Zones
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Manage and view all church geographical zones
            </p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', swahili_name: '', description: '' });
              setShowAddModal(true);
            }}
            className="bg-blue-800 hover:bg-blue-900 text-white p-2 md:px-4 md:py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Add Zone</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl sm:rounded-lg shadow-sm border p-3 sm:p-6 animate-pulse">
                <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2 sm:mb-4"></div>
                <div className="h-6 sm:h-8 bg-gray-200 rounded mb-1 sm:mb-2"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : zones.length === 0 ? (
          <div className="bg-white rounded-xl sm:rounded-lg shadow-sm border p-6 sm:p-12 text-center">
            <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No zones found</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">No active zones are currently configured in the system</p>
            <button
              onClick={() => {
                setFormData({ name: '', swahili_name: '', description: '' });
                setShowAddModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 transition-colors mx-auto text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              Add First Zone
            </button>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {/* Total Zones */}
              <div className="bg-white rounded-xl sm:rounded-lg shadow-sm border p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Zones</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">{zones.length}</p>
                  </div>
                  <div className="bg-blue-50 p-2 sm:p-3 rounded-lg ml-2">
                    <MapPin className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Total Members */}
              <div className="bg-white rounded-xl sm:rounded-lg shadow-sm border p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Members</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">
                      {zones.reduce((sum, z) => sum + z.member_count, 0)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-2 sm:p-3 rounded-lg ml-2">
                    <Users className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Average Members */}
              <div className="bg-white rounded-xl sm:rounded-lg shadow-sm border p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Avg Members/Zone</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1">
                      {zones.length > 0 ? Math.round(zones.reduce((sum, z) => sum + z.member_count, 0) / zones.length) : 0}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-2 sm:p-3 rounded-lg ml-2">
                    <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Active Status */}
              <div className="bg-white rounded-xl sm:rounded-lg shadow-sm border p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Status</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">Active</p>
                  </div>
                  <div className="bg-green-50 p-2 sm:p-3 rounded-lg ml-2">
                    <UserCheck className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Zones Grid */}
            <div className="bg-white rounded-xl sm:rounded-lg shadow-sm border">
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">All Zones</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">Click on any zone to view details and manage members</p>
              </div>
              <div className="p-3 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {zones.map((zone) => (
                    <div 
                      key={zone.id} 
                      className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                      onClick={() => router.push(`/zones/${zone.id}`)}
                    >
                      {/* Icon and Badge */}
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className={`h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br ${zone.color} rounded-lg flex items-center justify-center`}>
                          <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {zone.member_count} {zone.member_count === 1 ? 'Member' : 'Members'}
                        </span>
                      </div>

                      {/* Zone Name */}
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {zone.name}
                      </h4>

                      {/* Swahili Name */}
                      {zone.swahili_name && (
                        <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">
                          {zone.swahili_name}
                        </p>
                      )}

                      {/* Leader */}
                      {zone.leader_name && (
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">
                          <span className="font-medium">Leader:</span> {zone.leader_name}
                        </p>
                      )}

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">
                        {zone.description || 'No description available'}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          className="text-gray-500 hover:text-blue-600 p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(zone);
                          }}
                          title="Edit Zone"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          className="text-gray-500 hover:text-red-600 p-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteZone(zone.id);
                          }}
                          title="Delete Zone"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Zones Grid - Individual Cards */}
            <div className="md:hidden space-y-3">
              {zones.map((zone) => (
                <div 
                  key={zone.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                  onClick={() => router.push(`/zones/${zone.id}`)}
                >
                  {/* Icon and Badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`h-10 w-10 bg-gradient-to-br ${zone.color} rounded-lg flex items-center justify-center`}>
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {zone.member_count} {zone.member_count === 1 ? 'Member' : 'Members'}
                    </span>
                  </div>

                  {/* Zone Name */}
                  <h4 className="text-base font-semibold text-gray-900 mb-1">
                    {zone.name}
                  </h4>

                  {/* Swahili Name */}
                  {zone.swahili_name && (
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      {zone.swahili_name}
                    </p>
                  )}

                  {/* Leader */}
                  {zone.leader_name && (
                    <p className="text-xs text-gray-600 mb-2">
                      <span className="font-medium">Leader:</span> {zone.leader_name}
                    </p>
                  )}

                  {/* Description */}
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {zone.description || 'No description available'}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      className="text-gray-500 hover:text-blue-600 p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(zone);
                      }}
                      title="Edit Zone"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="text-gray-500 hover:text-red-600 p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteZone(zone.id);
                      }}
                      title="Delete Zone"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Add Zone Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Add New Zone</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zone Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Ebenezer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Swahili Name
                  </label>
                  <input
                    type="text"
                    value={formData.swahili_name}
                    onChange={(e) => setFormData({ ...formData, swahili_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Ebenezari"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief description of the zone..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddZone}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Zone
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Zone Modal */}
        {showEditModal && selectedZone && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Edit Zone</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedZone(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zone Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Swahili Name
                  </label>
                  <input
                    type="text"
                    value={formData.swahili_name}
                    onChange={(e) => setFormData({ ...formData, swahili_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedZone(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditZone}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
