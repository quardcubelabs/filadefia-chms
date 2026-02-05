'use client';

// Prevent SSR/prerendering issues during build
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/MainLayout';
import { useToast } from '@/components/Toast';
import { Loading } from '@/components/ui/EmptyState';
import { 
  Users, MapPin, UserCheck, TrendingUp, 
  Plus, Edit, Trash2, X, Eye
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
  const toast = useToast();
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
      toast.warning('Required Field', 'Zone name is required');
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
      toast.success('Zone Added', `${formData.name} has been created successfully!`);
      fetchZones();
    } catch (err: any) {
      console.error('Error adding zone:', err);
      setError(err.message || 'Failed to add zone');
      toast.error('Add Failed', err.message || 'Failed to add zone');
    } finally {
      setSaving(false);
    }
  };

  const handleEditZone = async () => {
    if (!selectedZone || !formData.name.trim()) {
      setError('Zone name is required');
      toast.warning('Required Field', 'Zone name is required');
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
      toast.success('Zone Updated', `${formData.name} has been updated!`);
      fetchZones();
    } catch (err: any) {
      console.error('Error updating zone:', err);
      setError(err.message || 'Failed to update zone');
      toast.error('Update Failed', err.message || 'Failed to update zone');
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

      toast.success('Zone Deleted', 'The zone has been removed!');
      fetchZones();
    } catch (err: any) {
      console.error('Error deleting zone:', err);
      setError(err.message || 'Failed to delete zone');
      toast.error('Delete Failed', err.message || 'Failed to delete zone');
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
        <Loading />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
        <div className="flex items-center justify-end">
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
          <div className="flex items-center justify-center py-12">
            <Loading text="Loading zones..." />
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
              {/* Total Zones Card */}
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm min-w-0">
                <div className="inline-flex p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl mb-2 sm:mb-3">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Total Zones</p>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {zones.length}
                </h3>
              </div>

              {/* Total Members Card */}
              <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm min-w-0">
                <div className="inline-flex p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl mb-2 sm:mb-3">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Total Members</p>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {zones.reduce((sum, z) => sum + z.member_count, 0)}
                </h3>
              </div>

              {/* Average Members Card */}
              <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm min-w-0">
                <div className="inline-flex p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl mb-2 sm:mb-3">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">Avg Members/Zone</p>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {zones.length > 0 ? Math.round(zones.reduce((sum, z) => sum + z.member_count, 0) / zones.length) : 0}
                </h3>
              </div>

              {/* With Leaders Card */}
              <div className="bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm min-w-0">
                <div className="inline-flex p-2 sm:p-3 bg-white rounded-lg sm:rounded-xl mb-2 sm:mb-3">
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600" />
                </div>
                <p className="text-xs text-gray-600 mb-1">With Leaders</p>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                  {zones.filter(z => z.leader_name).length}
                </h3>
              </div>
            </div>

            {/* Zones List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Leader</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {zones.map((zone) => (
                      <tr 
                        key={zone.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/zones/${zone.id}`)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">{zone.name}</p>
                              {zone.swahili_name && (
                                <p className="text-xs text-gray-500">{zone.swahili_name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell">
                          <div className="flex items-center text-sm text-gray-600">
                            <UserCheck className="h-4 w-4 mr-2" />
                            {zone.leader_name || <span className="text-gray-400">No leader</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <p className="text-sm text-gray-600 truncate max-w-[200px]">
                            {zone.description || 'No description'}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {zone.member_count}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              onClick={() => router.push(`/zones/${zone.id}`)}
                              title="View Zone"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              onClick={() => openEditModal(zone)}
                              title="Edit Zone"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              onClick={() => handleDeleteZone(zone.id)}
                              title="Delete Zone"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Add Zone Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
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
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
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
      </div>
    </MainLayout>
  );
}
