'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import { Visitor, VisitorStats } from '@/types';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
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
  Users,
  TrendingUp,
  BarChart3
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
  const { user, loading: authLoading, signOut } = useAuth();
  const toast = useToast();
  const [visitors, setVisitors] = useState<VisitorWithProfile[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [followUpFilter, setFollowUpFilter] = useState<string>('all');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save visitor');
      }
      
      await fetchVisitors();
      await fetchStats();
      setIsAddModalOpen(false);
      resetForm();
      toast.success('Visitor Added', `${formData.first_name} ${formData.last_name} has been added successfully`);
    } catch (err: any) {
      console.error('Error adding visitor:', err);
      toast.error('Failed to Add Visitor', err.message);
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
      
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update visitor');
      }
      
      await fetchVisitors();
      await fetchStats();
      setSelectedVisitor(null);
      resetForm();
      toast.success('Visitor Updated', 'Visitor information has been updated successfully');
    } catch (err: any) {
      console.error('Error updating visitor:', err);
      toast.error('Failed to Update Visitor', err.message);
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
      
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete visitor');
      }
      
      await fetchVisitors();
      await fetchStats();
      toast.success('Visitor Deleted', 'The visitor has been removed successfully');
    } catch (err: any) {
      console.error('Error deleting visitor:', err);
      toast.error('Failed to Delete Visitor', err.message);
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
      
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update follow-up status');
      }
      
      await fetchVisitors();
      await fetchStats();
      toast.success('Follow-up Marked', `${visitor.first_name} ${visitor.last_name} has been marked as followed up`);
    } catch (err: any) {
      console.error('Error marking follow-up:', err);
      toast.error('Failed to Mark Follow-up', err.message);
    }
  };

  const handleConvertToMember = async (visitor: VisitorWithProfile) => {
    if (!confirm(`Convert ${visitor.first_name} ${visitor.last_name} to a member?\n\nThis will create a new member record with their information.`)) return;
    
    try {
      const response = await fetch(`/api/visitors/${visitor.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to convert visitor to member');
      }
      
      await fetchVisitors();
      await fetchStats();
      toast.success('Converted to Member', `${visitor.first_name} ${visitor.last_name} has been added to members!`);
    } catch (err: any) {
      console.error('Error converting visitor:', err);
      toast.error('Failed to Convert', err.message);
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

  // Theme classes
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <div className={`min-h-screen ${bgColor}`}>
      {/* Sidebar */}
      <Sidebar darkMode={darkMode} onSignOut={signOut} mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-20 transition-all duration-300">
        {/* Top Navbar */}
        <TopNavbar
          title="Visitors Management"
          subtitle="Track and manage church visitors"
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Main Content Area */}
        <main className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
          {/* Stats Cards - Dashboard Style with Pastel Colors */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Total Visitors Card - Blue Pastel */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-blue-100 to-blue-50'} rounded-3xl p-6 shadow-sm`}>
                <div className={`inline-flex p-3 ${darkMode ? 'bg-blue-700/50' : 'bg-white'} rounded-xl mb-4`}>
                  <Users className={`h-6 w-6 ${darkMode ? 'text-white' : 'text-blue-600'}`} />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-blue-100' : 'text-gray-600'}`}>Total Visitors</p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total_visitors}</h3>
              </div>

              {/* New This Month Card - Cyan Pastel */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-cyan-600 to-cyan-700' : 'bg-gradient-to-br from-cyan-100 to-cyan-50'} rounded-3xl p-6 shadow-sm`}>
                <div className={`inline-flex p-3 ${darkMode ? 'bg-cyan-700/50' : 'bg-white'} rounded-xl mb-4`}>
                  <UserPlus className={`h-6 w-6 ${darkMode ? 'text-white' : 'text-cyan-600'}`} />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-cyan-100' : 'text-gray-600'}`}>New This Month</p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.new_this_month}</h3>
              </div>

              {/* Converted Card - Purple Pastel */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-purple-600 to-purple-700' : 'bg-gradient-to-br from-purple-100 to-purple-50'} rounded-3xl p-6 shadow-sm`}>
                <div className={`inline-flex p-3 ${darkMode ? 'bg-purple-700/50' : 'bg-white'} rounded-xl mb-4`}>
                  <CheckCircle className={`h-6 w-6 ${darkMode ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-purple-100' : 'text-gray-600'}`}>Converted</p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.converted}</h3>
              </div>

              {/* Conversion Rate Card - Green Pastel */}
              <div className={`${darkMode ? 'bg-gradient-to-br from-green-600 to-green-700' : 'bg-gradient-to-br from-green-100 to-green-50'} rounded-3xl p-6 shadow-sm`}>
                <div className={`inline-flex p-3 ${darkMode ? 'bg-green-700/50' : 'bg-white'} rounded-xl mb-4`}>
                  <TrendingUp className={`h-6 w-6 ${darkMode ? 'text-white' : 'text-green-600'}`} />
                </div>
                <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-green-100' : 'text-gray-600'}`}>Conversion Rate</p>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.conversion_rate.toFixed(1)}%</h3>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className={`${cardBg} rounded-2xl p-4 mb-6 border ${borderColor} shadow-sm`}>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-3 flex-1 w-full lg:w-auto">
                <div className="relative flex-1 md:max-w-md">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${textSecondary}`} />
                  <input
                    type="text"
                    placeholder="Search visitors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 ${cardBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`px-4 py-2.5 ${cardBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                  className={`px-4 py-2.5 ${cardBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="all">All Follow-ups</option>
                  <option value="followed_up">Followed Up</option>
                  <option value="not_followed_up">Not Followed Up</option>
                </select>
              </div>

              {/* Add Button */}
              <button
                onClick={() => {
                  setSelectedVisitor(null);
                  resetForm();
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm whitespace-nowrap"
              >
                <Plus className="h-5 w-5" />
                Add Visitor
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Visitors Table */}
          <div className={`${cardBg} rounded-2xl border ${borderColor} shadow-sm overflow-hidden`}>
            {filteredVisitors.length === 0 ? (
              <div className="p-12 text-center">
                <Users className={`h-16 w-16 ${textSecondary} mx-auto mb-4 opacity-30`} />
                <p className={`${textSecondary} text-lg`}>No visitors found</p>
                <p className={`${textSecondary} text-sm mt-1`}>Add your first visitor to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border-b ${borderColor}`}>
                    <tr>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${textPrimary}`}>Name</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${textPrimary}`}>Contact</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${textPrimary}`}>Visit Date</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${textPrimary}`}>Status</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${textPrimary}`}>Follow-up</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${textPrimary}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${borderColor}`}>
                    {filteredVisitors.map((visitor) => (
                      <tr key={visitor.id} className={`${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className="px-6 py-4">
                          <div>
                            <p className={`font-medium ${textPrimary}`}>
                              {visitor.first_name} {visitor.last_name}
                            </p>
                            {visitor.occupation && (
                              <p className={`text-sm ${textSecondary}`}>{visitor.occupation}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {visitor.phone && (
                              <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                                <Phone className="h-4 w-4" />
                                {visitor.phone}
                              </div>
                            )}
                            {visitor.email && (
                              <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                                <Mail className="h-4 w-4" />
                                {visitor.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-2 text-sm ${textSecondary}`}>
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
                            <span className={`text-sm ${textSecondary} flex items-center gap-1`}>
                              <XCircle className="h-4 w-4" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(visitor)}
                              className={`p-2 ${darkMode ? 'hover:bg-blue-900/50' : 'hover:bg-blue-50'} rounded-lg text-blue-600 transition-colors`}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {!visitor.followed_up && (
                              <button
                                onClick={() => handleMarkFollowUp(visitor)}
                                className={`p-2 ${darkMode ? 'hover:bg-green-900/50' : 'hover:bg-green-50'} rounded-lg text-green-600 transition-colors`}
                                title="Mark as followed up"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            {!visitor.converted && (
                              <button
                                onClick={() => handleConvertToMember(visitor)}
                                className={`p-2 ${darkMode ? 'hover:bg-purple-900/50' : 'hover:bg-purple-50'} rounded-lg text-purple-600 transition-colors`}
                                title="Convert to member"
                              >
                                <UserPlus className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteVisitor(visitor.id)}
                              className={`p-2 ${darkMode ? 'hover:bg-red-900/50' : 'hover:bg-red-50'} rounded-lg text-red-600 transition-colors`}
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
        </main>
      </div>

      {/* Add/Edit Modal */}
      {(isAddModalOpen || selectedVisitor) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${cardBg} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl`}>
            <div className={`p-6 border-b ${borderColor} sticky top-0 ${cardBg} rounded-t-2xl`}>
              <h2 className={`text-2xl font-bold ${textPrimary}`}>
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
                  className={`px-4 py-2.5 ${cardBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <input
                  type="text"
                  placeholder="Last Name *"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                  className={`px-4 py-2.5 ${cardBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className={`px-4 py-2.5 ${cardBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`px-4 py-2.5 ${cardBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className={`w-full px-4 py-2.5 ${cardBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />

              <div className="grid grid-cols-3 gap-4">
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  className={`px-4 py-2.5 ${cardBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                  className={`px-4 py-2.5 ${cardBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <select
                  value={formData.marital_status}
                  onChange={(e) => setFormData({...formData, marital_status: e.target.value})}
                  className={`px-4 py-2.5 ${cardBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                  className={`px-4 py-2.5 ${cardBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <input
                  type="text"
                  placeholder="How did you hear about us?"
                  value={formData.how_did_you_hear}
                  onChange={(e) => setFormData({...formData, how_did_you_hear: e.target.value})}
                  className={`px-4 py-2.5 ${cardBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1`}>Visit Date *</label>
                <input
                  type="date"
                  value={formData.visited_date}
                  onChange={(e) => setFormData({...formData, visited_date: e.target.value})}
                  required
                  className={`w-full px-4 py-2.5 ${cardBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className={`w-full px-4 py-2.5 ${cardBg} ${textPrimary} border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
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
                  className={`flex-1 px-6 py-3 border ${borderColor} ${textPrimary} rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
