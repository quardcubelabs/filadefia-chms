'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Visitor, VisitorStats } from '@/types';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  UserPlus,
  Users
} from 'lucide-react';

interface VisitorWithProfile extends Visitor {
  referred_by_member?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  followed_up_by_profile?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export default function VisitorsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [visitors, setVisitors] = useState<VisitorWithProfile[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [followUpFilter, setFollowUpFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorWithProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    gender: '',
    date_of_birth: '',
    marital_status: '',
    occupation: '',
    how_did_you_hear: '',
    visited_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      fetchVisitors();
      fetchStats();
    }
  }, [authLoading, user, router, statusFilter, followUpFilter]);

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (followUpFilter === 'followed_up') {
        params.append('followed_up', 'true');
      } else if (followUpFilter === 'not_followed_up') {
        params.append('followed_up', 'false');
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/visitors?${params}`);
      if (!response.ok) throw new Error('Failed to fetch visitors');
      
      const result = await response.json();
      setVisitors(result.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching visitors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/visitors/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const result = await response.json();
      setStats(result.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleAddVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to save visitor');
      
      await fetchVisitors();
      await fetchStats();
      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitor) return;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/visitors/${selectedVisitor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to update visitor');
      
      await fetchVisitors();
      setSelectedVisitor(null);
      resetForm();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVisitor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this visitor?')) return;
    
    try {
      const response = await fetch(`/api/visitors/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete visitor');
      
      await fetchVisitors();
      await fetchStats();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleMarkFollowUp = async (visitor: VisitorWithProfile) => {
    try {
      const response = await fetch(`/api/visitors/${visitor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followed_up: true,
          followed_up_at: new Date().toISOString()
        })
      });
      
      if (!response.ok) throw new Error('Failed to update follow-up status');
      
      await fetchVisitors();
      await fetchStats();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleConvertToMember = async (visitor: VisitorWithProfile) => {
    try {
      const response = await fetch(`/api/visitors/${visitor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          converted: true,
          conversion_date: new Date().toISOString().split('T')[0],
          status: 'converted'
        })
      });
      
      if (!response.ok) throw new Error('Failed to update conversion status');
      
      await fetchVisitors();
      await fetchStats();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const openEditModal = (visitor: VisitorWithProfile) => {
    setSelectedVisitor(visitor);
    setFormData({
      first_name: visitor.first_name,
      last_name: visitor.last_name,
      phone: visitor.phone || '',
      email: visitor.email || '',
      address: visitor.address || '',
      gender: visitor.gender || '',
      date_of_birth: visitor.date_of_birth || '',
      marital_status: visitor.marital_status || '',
      occupation: visitor.occupation || '',
      how_did_you_hear: visitor.how_did_you_hear || '',
      visited_date: visitor.visited_date,
      notes: visitor.notes || ''
    });
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      address: '',
      gender: '',
      date_of_birth: '',
      marital_status: '',
      occupation: '',
      how_did_you_hear: '',
      visited_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const filteredVisitors = visitors.filter(visitor => {
    const searchLower = searchTerm.toLowerCase();
    return (
      visitor.first_name.toLowerCase().includes(searchLower) ||
      visitor.last_name.toLowerCase().includes(searchLower) ||
      (visitor.email?.toLowerCase().includes(searchLower) || false) ||
      (visitor.phone?.includes(searchTerm) || false)
    );
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Visitors Management</h1>
              <p className="text-slate-600 mt-2">Track and manage church visitors</p>
            </div>
            <button
              onClick={() => {
                setSelectedVisitor(null);
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="h-5 w-5" />
              Add Visitor
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Visitors</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total_visitors}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">New This Month</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.new_this_month}</p>
                  </div>
                  <UserPlus className="h-8 w-8 text-green-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Converted</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.converted}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Conversion Rate</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.conversion_rate.toFixed(1)}%</p>
                  </div>
                  <div className="h-8 w-8 text-orange-500 opacity-20 text-lg">📊</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search visitors by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="converted">Converted</option>
              <option value="not_interested">Not Interested</option>
            </select>
            <select
              value={followUpFilter}
              onChange={(e) => setFollowUpFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Follow-ups</option>
              <option value="followed_up">Followed Up</option>
              <option value="not_followed_up">Not Followed Up</option>
            </select>
          </div>
        </div>

        {/* Visitors Table */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredVisitors.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No visitors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Contact</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Visit Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Follow-up</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredVisitors.map((visitor) => (
                    <tr key={visitor.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">
                            {visitor.first_name} {visitor.last_name}
                          </p>
                          {visitor.occupation && (
                            <p className="text-sm text-slate-600">{visitor.occupation}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {visitor.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="h-4 w-4" />
                              {visitor.phone}
                            </div>
                          )}
                          {visitor.email && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail className="h-4 w-4" />
                              {visitor.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(visitor.visited_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          visitor.status === 'converted'
                            ? 'bg-green-100 text-green-700'
                            : visitor.status === 'interested'
                            ? 'bg-blue-100 text-blue-700'
                            : visitor.status === 'contacted'
                            ? 'bg-yellow-100 text-yellow-700'
                            : visitor.status === 'not_interested'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {visitor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {visitor.followed_up ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Done</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-600 flex items-center gap-1">
                            <XCircle className="h-4 w-4" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(visitor)}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {!visitor.followed_up && (
                            <button
                              onClick={() => handleMarkFollowUp(visitor)}
                              className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                              title="Mark as followed up"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {!visitor.converted && (
                            <button
                              onClick={() => handleConvertToMember(visitor)}
                              className="p-2 hover:bg-purple-50 rounded-lg text-purple-600 transition-colors"
                              title="Convert to member"
                            >
                              <UserPlus className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteVisitor(visitor.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                            title="Delete"
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
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen || selectedVisitor ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedVisitor ? 'Edit Visitor' : 'Add New Visitor'}
              </h2>
            </div>

            <form onSubmit={selectedVisitor ? handleUpdateVisitor : handleAddVisitor} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name *"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Last Name *"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="grid grid-cols-3 gap-4">
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <input
                  type="date"
                  placeholder="Date of Birth"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={formData.marital_status}
                  onChange={(e) => setFormData({...formData, marital_status: e.target.value})}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Marital Status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Occupation"
                  value={formData.occupation}
                  onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="How did you hear about us?"
                  value={formData.how_did_you_hear}
                  onChange={(e) => setFormData({...formData, how_did_you_hear: e.target.value})}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <input
                type="date"
                placeholder="Visit Date *"
                value={formData.visited_date}
                onChange={(e) => setFormData({...formData, visited_date: e.target.value})}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {saving ? 'Saving...' : (selectedVisitor ? 'Update Visitor' : 'Add Visitor')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setSelectedVisitor(null);
                    resetForm();
                  }}
                  className="flex-1 px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
