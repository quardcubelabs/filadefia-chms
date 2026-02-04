'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/MainLayout';
import { Modal, Button, Input, TextArea, Select, Badge, Card, EmptyState } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { 
  Asset, 
  AssetCategory, 
  AssetCondition, 
  AssetStatus, 
  AssetFormData,
  AssetMaintenance,
  AssetMaintenanceFormData
} from '@/types';
import {
  Plus,
  Package,
  Car,
  Monitor,
  Armchair,
  Music,
  Printer,
  UtensilsCrossed,
  Speaker,
  Lightbulb,
  Wrench,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  Building2,
  Search,
  Filter,
  FileText,
  History
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
}

const categoryLabels: Record<AssetCategory, string> = {
  property: 'Property',
  vehicle: 'Vehicle',
  electronics: 'Electronics',
  furniture: 'Furniture',
  musical_instruments: 'Musical Instruments',
  office_equipment: 'Office Equipment',
  kitchen_equipment: 'Kitchen Equipment',
  sound_system: 'Sound System',
  lighting: 'Lighting',
  tools: 'Tools',
  other: 'Other'
};

const categoryIcons: Record<AssetCategory, React.ReactNode> = {
  property: <Building2 className="h-5 w-5" />,
  vehicle: <Car className="h-5 w-5" />,
  electronics: <Monitor className="h-5 w-5" />,
  furniture: <Armchair className="h-5 w-5" />,
  musical_instruments: <Music className="h-5 w-5" />,
  office_equipment: <Printer className="h-5 w-5" />,
  kitchen_equipment: <UtensilsCrossed className="h-5 w-5" />,
  sound_system: <Speaker className="h-5 w-5" />,
  lighting: <Lightbulb className="h-5 w-5" />,
  tools: <Wrench className="h-5 w-5" />,
  other: <MoreHorizontal className="h-5 w-5" />
};

const conditionColors: Record<AssetCondition, string> = {
  excellent: 'bg-green-100 text-green-700',
  good: 'bg-blue-100 text-blue-700',
  fair: 'bg-yellow-100 text-yellow-700',
  poor: 'bg-orange-100 text-orange-700',
  needs_repair: 'bg-red-100 text-red-700',
  non_functional: 'bg-gray-100 text-gray-700'
};

const conditionLabels: Record<AssetCondition, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
  needs_repair: 'Needs Repair',
  non_functional: 'Non-Functional'
};

const statusColors: Record<AssetStatus, string> = {
  active: 'bg-green-100 text-green-700',
  in_use: 'bg-blue-100 text-blue-700',
  in_storage: 'bg-gray-100 text-gray-700',
  under_maintenance: 'bg-yellow-100 text-yellow-700',
  disposed: 'bg-red-100 text-red-700',
  donated: 'bg-purple-100 text-purple-700',
  sold: 'bg-orange-100 text-orange-700',
  lost: 'bg-red-100 text-red-700'
};

const statusLabels: Record<AssetStatus, string> = {
  active: 'Active',
  in_use: 'In Use',
  in_storage: 'In Storage',
  under_maintenance: 'Under Maintenance',
  disposed: 'Disposed',
  donated: 'Donated',
  sold: 'Sold',
  lost: 'Lost'
};

export default function AssetsPage() {
  const router = useRouter();
  const { user, loading: authLoading, supabase } = useAuth();
  const toast = useToast();

  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<AssetCategory | 'all'>('all');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<AssetStatus | 'all'>('all');
  const [filterCondition, setFilterCondition] = useState<AssetCondition | 'all'>('all');

  // Modal states
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<AssetMaintenance[]>([]);
  const [saving, setSaving] = useState(false);

  // Form data
  const initialFormData: AssetFormData = {
    name: '',
    category: 'other',
    description: '',
    serial_number: '',
    model: '',
    brand: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_price: 0,
    current_value: 0,
    condition: 'good',
    status: 'active',
    location: '',
    department_id: '',
    notes: ''
  };

  const [assetForm, setAssetForm] = useState<AssetFormData>(initialFormData);

  const initialMaintenanceForm: AssetMaintenanceFormData = {
    maintenance_type: 'routine',
    description: '',
    cost: 0,
    performed_by: '',
    performed_date: new Date().toISOString().split('T')[0],
    next_maintenance_date: '',
    notes: ''
  };

  const [maintenanceForm, setMaintenanceForm] = useState<AssetMaintenanceFormData>(initialMaintenanceForm);

  // Check user permissions
  const userRole = user?.profile?.role;
  const canManageAssets = userRole === 'administrator' || userRole === 'pastor' || userRole === 'treasurer';

  // Categories for tabs
  const categories: (AssetCategory | 'all')[] = [
    'all',
    'property',
    'vehicle',
    'electronics',
    'furniture',
    'musical_instruments',
    'office_equipment',
    'kitchen_equipment',
    'sound_system',
    'lighting',
    'tools',
    'other'
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && supabase) {
      fetchAssets();
      fetchDepartments();
    }
  }, [authLoading, user, supabase, activeCategory, filterStatus, filterCondition]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (activeCategory !== 'all') {
        params.append('category', activeCategory);
      }
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterCondition !== 'all') {
        params.append('condition', filterCondition);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const response = await fetch(`/api/assets?${params}`);
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setAssets(result.data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('departments')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    setDepartments(data || []);
  };

  const fetchMaintenanceRecords = async (assetId: string) => {
    try {
      const response = await fetch(`/api/assets/maintenance?asset_id=${assetId}`);
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setMaintenanceRecords(result.data || []);
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      toast.error('Failed to load maintenance history');
    }
  };

  const handleSearch = () => {
    fetchAssets();
  };

  const handleCreateAsset = async () => {
    if (!assetForm.name) {
      toast.error('Please enter an asset name');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...assetForm,
          created_by: user?.profile?.id
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Asset created successfully');
      setShowAssetModal(false);
      resetAssetForm();
      fetchAssets();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create asset');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAsset = async () => {
    if (!selectedAsset) return;

    setSaving(true);
    try {
      const response = await fetch('/api/assets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAsset.id,
          ...assetForm
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Asset updated successfully');
      setShowAssetModal(false);
      resetAssetForm();
      fetchAssets();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update asset');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const response = await fetch(`/api/assets?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Asset deleted successfully');
      fetchAssets();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete asset');
    }
  };

  const handleAddMaintenance = async () => {
    if (!selectedAsset || !maintenanceForm.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/assets/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: selectedAsset.id,
          ...maintenanceForm,
          created_by: user?.profile?.id
        })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      toast.success('Maintenance record added');
      setShowMaintenanceModal(false);
      resetMaintenanceForm();
      fetchMaintenanceRecords(selectedAsset.id);
      fetchAssets();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add maintenance record');
    } finally {
      setSaving(false);
    }
  };

  const resetAssetForm = () => {
    setAssetForm(initialFormData);
    setSelectedAsset(null);
  };

  const resetMaintenanceForm = () => {
    setMaintenanceForm(initialMaintenanceForm);
  };

  const openEditModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setAssetForm({
      name: asset.name,
      category: asset.category,
      description: asset.description || '',
      serial_number: asset.serial_number || '',
      model: asset.model || '',
      brand: asset.brand || '',
      purchase_date: asset.purchase_date || '',
      purchase_price: asset.purchase_price || 0,
      current_value: asset.current_value || 0,
      condition: asset.condition,
      status: asset.status,
      location: asset.location || '',
      department_id: asset.department_id || '',
      notes: asset.notes || ''
    });
    setShowAssetModal(true);
  };

  const openViewModal = async (asset: Asset) => {
    setSelectedAsset(asset);
    await fetchMaintenanceRecords(asset.id);
    setShowViewModal(true);
  };

  const formatCurrency = (amount: number, currency: string = 'TZS') => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculate stats
  const stats = {
    total: assets.length,
    totalValue: assets.reduce((sum, a) => sum + (a.current_value || 0), 0),
    active: assets.filter(a => a.status === 'active').length,
    needsRepair: assets.filter(a => a.condition === 'needs_repair').length,
    underMaintenance: assets.filter(a => a.status === 'under_maintenance').length
  };

  // Filter assets by search
  const filteredAssets = assets.filter(asset => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.asset_number?.toLowerCase().includes(query) ||
      asset.serial_number?.toLowerCase().includes(query) ||
      asset.location?.toLowerCase().includes(query)
    );
  });

  if (authLoading) {
    return (
      <MainLayout title="Assets">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Church Assets" subtitle="Track and manage all church assets">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-4 md:gap-6 mb-6">
        {/* Total Assets Card */}
        <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm min-w-0">
          <div className="inline-flex p-2.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
            <Package className="h-5 w-5 sm:h-7 sm:w-7 text-blue-600" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Total Assets</p>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            {loading ? '...' : stats.total}
          </h3>
        </div>

        {/* Total Value Card */}
        <div className="bg-gradient-to-br from-cyan-100 to-cyan-50 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm min-w-0">
          <div className="inline-flex p-2.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
            <DollarSign className="h-5 w-5 sm:h-7 sm:w-7 text-cyan-600" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Total Value</p>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
            {loading ? '...' : formatCurrency(stats.totalValue)}
          </h3>
        </div>

        {/* Active Assets Card */}
        <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm min-w-0">
          <div className="inline-flex p-2.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
            <CheckCircle className="h-5 w-5 sm:h-7 sm:w-7 text-green-600" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Active</p>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            {loading ? '...' : stats.active}
          </h3>
        </div>

        {/* Under Maintenance Card */}
        <div className="bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm min-w-0">
          <div className="inline-flex p-2.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
            <Wrench className="h-5 w-5 sm:h-7 sm:w-7 text-yellow-600" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Under Maintenance</p>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            {loading ? '...' : stats.underMaintenance}
          </h3>
        </div>

        {/* Needs Repair Card */}
        <div className="bg-gradient-to-br from-red-100 to-red-50 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm min-w-0">
          <div className="inline-flex p-2.5 sm:p-4 bg-white rounded-xl sm:rounded-2xl mb-3 sm:mb-4">
            <AlertCircle className="h-5 w-5 sm:h-7 sm:w-7 text-red-600" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Needs Repair</p>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            {loading ? '...' : stats.needsRepair}
          </h3>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-4 md:mb-6">
        <nav className="flex space-x-0 overflow-x-auto">
          {categories.slice(0, 7).map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`relative flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-2 md:py-3 font-medium text-xs md:text-sm transition-all duration-200 whitespace-nowrap ${
                activeCategory === category
                  ? 'bg-red-100 text-red-600 rounded-tl-lg'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {category === 'all' && <Package className="h-3.5 w-3.5 md:h-4 md:w-4" />}
              {category !== 'all' && categoryIcons[category]}
              <span>{category === 'all' ? 'All Assets' : categoryLabels[category]}</span>
              {activeCategory === category && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
              )}
            </button>
          ))}
          {/* More categories dropdown */}
          <div className="relative group">
            <button
              className={`flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-2 md:py-3 font-medium text-xs md:text-sm transition-all duration-200 whitespace-nowrap ${
                categories.slice(7).includes(activeCategory as any)
                  ? 'bg-red-100 text-red-600 rounded-tl-lg'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <MoreHorizontal className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span>More</span>
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block z-10">
              {categories.slice(7).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`w-full flex items-center space-x-2 px-4 py-2 text-sm text-left hover:bg-gray-50 ${
                    activeCategory === category ? 'bg-red-50 text-red-600' : 'text-gray-700'
                  }`}
                >
                  {category !== 'all' && categoryIcons[category]}
                  <span>{categoryLabels[category as AssetCategory]}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <Button variant="secondary" onClick={handleSearch}>
            Search
          </Button>
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AssetStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
          >
            <option value="all">All Status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value as AssetCondition | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
          >
            <option value="all">All Conditions</option>
            {Object.entries(conditionLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Header with Add Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {activeCategory === 'all' ? 'All Assets' : categoryLabels[activeCategory as AssetCategory]}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canManageAssets && (
          <Button
            onClick={() => {
              resetAssetForm();
              if (activeCategory !== 'all') {
                setAssetForm(prev => ({ ...prev, category: activeCategory as AssetCategory }));
              }
              setShowAssetModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        )}
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredAssets.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="No Assets Found"
          description={
            activeCategory === 'all'
              ? 'No assets have been registered yet.'
              : `No ${categoryLabels[activeCategory as AssetCategory].toLowerCase()} assets found.`
          }
          action={
            canManageAssets ? {
              label: 'Add Asset',
              onClick: () => {
                resetAssetForm();
                setShowAssetModal(true);
              },
              icon: <Plus className="h-4 w-4" />
            } : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Purchased</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          {categoryIcons[asset.category]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{asset.name}</p>
                          <p className="text-xs text-gray-500">{asset.asset_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <div className="flex items-center text-sm text-gray-600">
                        <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate max-w-[120px]">{asset.location || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formatCurrency(asset.current_value || 0, asset.currency)}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">
                        {asset.purchase_date ? formatDate(asset.purchase_date) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={conditionColors[asset.condition]}>
                        {conditionLabels[asset.condition]}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <Badge className={statusColors[asset.status]}>
                        {statusLabels[asset.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => openViewModal(asset)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canManageAssets && (
                          <>
                            <button
                              onClick={() => openEditModal(asset)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Asset Modal */}
      <Modal
        isOpen={showAssetModal}
        onClose={() => {
          setShowAssetModal(false);
          resetAssetForm();
        }}
        title={selectedAsset ? 'Edit Asset' : 'Add New Asset'}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Asset Name *"
              value={assetForm.name}
              onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
              placeholder="Enter asset name"
            />
            <Select
              label="Category *"
              value={assetForm.category}
              onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value as AssetCategory })}
              options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
            />
          </div>

          <TextArea
            label="Description"
            value={assetForm.description}
            onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
            placeholder="Enter asset description"
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Serial Number"
              value={assetForm.serial_number}
              onChange={(e) => setAssetForm({ ...assetForm, serial_number: e.target.value })}
              placeholder="Enter serial number"
            />
            <Input
              label="Model"
              value={assetForm.model}
              onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })}
              placeholder="Enter model"
            />
            <Input
              label="Brand"
              value={assetForm.brand}
              onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })}
              placeholder="Enter brand"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Purchase Date"
              type="date"
              value={assetForm.purchase_date}
              onChange={(e) => setAssetForm({ ...assetForm, purchase_date: e.target.value })}
            />
            <Input
              label="Purchase Price"
              type="number"
              value={(assetForm.purchase_price || 0).toString()}
              onChange={(e) => setAssetForm({ ...assetForm, purchase_price: parseFloat(e.target.value) || 0 })}
              placeholder="0"
            />
            <Input
              label="Current Value"
              type="number"
              value={(assetForm.current_value || 0).toString()}
              onChange={(e) => setAssetForm({ ...assetForm, current_value: parseFloat(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Condition *"
              value={assetForm.condition || 'good'}
              onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value as AssetCondition })}
              options={Object.entries(conditionLabels).map(([value, label]) => ({ value, label }))}
            />
            <Select
              label="Status *"
              value={assetForm.status || 'active'}
              onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value as AssetStatus })}
              options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Location"
              value={assetForm.location}
              onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
              placeholder="Enter location"
            />
            <Select
              label="Department"
              value={assetForm.department_id || ''}
              onChange={(e) => setAssetForm({ ...assetForm, department_id: e.target.value })}
              options={[
                { value: '', label: 'No Department' },
                ...departments.map((dept) => ({ value: dept.id, label: dept.name }))
              ]}
            />
          </div>

          <TextArea
            label="Notes"
            value={assetForm.notes}
            onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
            placeholder="Additional notes"
            rows={2}
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <Button variant="secondary" onClick={() => {
            setShowAssetModal(false);
            resetAssetForm();
          }}>
            Cancel
          </Button>
          <Button
            onClick={selectedAsset ? handleUpdateAsset : handleCreateAsset}
            disabled={saving}
          >
            {saving ? 'Saving...' : (selectedAsset ? 'Update Asset' : 'Create Asset')}
          </Button>
        </div>
      </Modal>

      {/* View Asset Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedAsset(null);
          setMaintenanceRecords([]);
        }}
        title="Asset Details"
        size="lg"
      >
        {selectedAsset && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Asset Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  {categoryIcons[selectedAsset.category]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedAsset.name}</h3>
                  <p className="text-sm text-gray-500">{selectedAsset.asset_number}</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Badge className={statusColors[selectedAsset.status]}>
                  {statusLabels[selectedAsset.status]}
                </Badge>
                <Badge className={conditionColors[selectedAsset.condition]}>
                  {conditionLabels[selectedAsset.condition]}
                </Badge>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{categoryLabels[selectedAsset.category]}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{selectedAsset.location || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Serial Number</p>
                <p className="font-medium">{selectedAsset.serial_number || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Model</p>
                <p className="font-medium">{selectedAsset.model || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Brand</p>
                <p className="font-medium">{selectedAsset.brand || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Purchase Date</p>
                <p className="font-medium">{formatDate(selectedAsset.purchase_date || null)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Purchase Price</p>
                <p className="font-medium">{formatCurrency(selectedAsset.purchase_price || 0, selectedAsset.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Value</p>
                <p className="font-medium">{formatCurrency(selectedAsset.current_value || 0, selectedAsset.currency)}</p>
              </div>
            </div>

            {selectedAsset.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-700">{selectedAsset.description}</p>
              </div>
            )}

            {selectedAsset.notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="text-gray-700">{selectedAsset.notes}</p>
              </div>
            )}

            {/* Maintenance History */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Maintenance History
                </h4>
                {canManageAssets && (
                  <Button
                    size="sm"
                    onClick={() => setShowMaintenanceModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Record
                  </Button>
                )}
              </div>

              {maintenanceRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No maintenance records</p>
              ) : (
                <div className="space-y-3">
                  {maintenanceRecords.map((record) => (
                    <div key={record.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">{record.maintenance_type.replace('_', ' ')}</span>
                        <span className="text-sm text-gray-500">{formatDate(record.performed_date)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{record.description}</p>
                      {record.cost > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          Cost: {formatCurrency(record.cost, record.currency)}
                        </p>
                      )}
                      {record.performed_by && (
                        <p className="text-xs text-gray-500 mt-1">
                          Performed by: {record.performed_by}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button variant="secondary" onClick={() => {
            setShowViewModal(false);
            setSelectedAsset(null);
            setMaintenanceRecords([]);
          }}>
            Close
          </Button>
        </div>
      </Modal>

      {/* Add Maintenance Modal */}
      <Modal
        isOpen={showMaintenanceModal}
        onClose={() => {
          setShowMaintenanceModal(false);
          resetMaintenanceForm();
        }}
        title="Add Maintenance Record"
      >
        <div className="space-y-4">
          <Select
            label="Maintenance Type *"
            value={maintenanceForm.maintenance_type}
            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenance_type: e.target.value })}
            options={[
              { value: 'routine', label: 'Routine Maintenance' },
              { value: 'repair', label: 'Repair' },
              { value: 'upgrade', label: 'Upgrade' },
              { value: 'inspection', label: 'Inspection' },
              { value: 'cleaning', label: 'Cleaning' },
              { value: 'replacement', label: 'Replacement' }
            ]}
          />

          <TextArea
            label="Description *"
            value={maintenanceForm.description}
            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
            placeholder="Describe the maintenance performed"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cost"
              type="number"
              value={(maintenanceForm.cost || 0).toString()}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: parseFloat(e.target.value) || 0 })}
              placeholder="0"
            />
            <Input
              label="Performed By"
              value={maintenanceForm.performed_by || ''}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, performed_by: e.target.value })}
              placeholder="Technician name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date Performed *"
              type="date"
              value={maintenanceForm.performed_date}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, performed_date: e.target.value })}
            />
            <Input
              label="Next Maintenance Date"
              type="date"
              value={maintenanceForm.next_maintenance_date}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, next_maintenance_date: e.target.value })}
            />
          </div>

          <TextArea
            label="Notes"
            value={maintenanceForm.notes}
            onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
            placeholder="Additional notes"
            rows={2}
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <Button variant="secondary" onClick={() => {
            setShowMaintenanceModal(false);
            resetMaintenanceForm();
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddMaintenance}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Add Record'}
          </Button>
        </div>
      </Modal>
    </MainLayout>
  );
}
