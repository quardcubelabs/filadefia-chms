'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { DashboardStats } from '@/types';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    total_members: 0,
    active_members: 0,
    total_departments: 0,
    monthly_income: 0,
    monthly_expenses: 0,
    attendance_rate: 0,
    upcoming_events: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      window.location.href = '/setup';
      return;
    }

    if (!authLoading && !user) {
      window.location.href = '/login';
      return;
    }

    if (user) {
      // Simulate loading dashboard stats
      setTimeout(() => {
        setStats({
          total_members: 150,
          active_members: 142,
          total_departments: 12,
          monthly_income: 2500000,
          monthly_expenses: 1200000,
          attendance_rate: 85,
          upcoming_events: 5,
        });
        setLoading(false);
      }, 1000);
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fcc-blue-600"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-fcc-gradient rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">FCC</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Church Management System</h1>
                <p className="text-sm text-gray-600">Filadefia Christian Center - TAG</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.profile?.first_name} {user?.profile?.last_name}
                </p>
                <p className="text-xs text-gray-600 capitalize">
                  {user?.profile?.role?.replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={() => window.location.href = '/api/auth/logout'}
                className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome back, {user?.profile?.first_name}!
          </h2>
          <p className="text-gray-600">Here's what's happening at FCC today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-fcc-blue-100 rounded-lg">
                <div className="w-6 h-6 bg-fcc-blue-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_members}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_members}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-fcc-gold-100 rounded-lg">
                <div className="w-6 h-6 bg-fcc-gold-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthly_income)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <div className="w-6 h-6 bg-purple-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.attendance_rate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-2 bg-fcc-blue-50 text-fcc-blue-700 rounded-lg hover:bg-fcc-blue-100 transition-colors">
                Add New Member
              </button>
              <button className="w-full text-left px-4 py-2 bg-fcc-gold-50 text-fcc-gold-700 rounded-lg hover:bg-fcc-gold-100 transition-colors">
                Record Attendance
              </button>
              <button className="w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                Add Financial Transaction
              </button>
              <button className="w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                Create Announcement
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-fcc-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">New member registered</p>
                  <p className="text-xs text-gray-600">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-fcc-gold-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">Tithe payment received</p>
                  <p className="text-xs text-gray-600">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm text-gray-900">Sunday service attendance recorded</p>
                  <p className="text-xs text-gray-600">1 day ago</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              <div className="border-l-4 border-fcc-blue-600 pl-3">
                <p className="text-sm font-medium text-gray-900">Youth Conference</p>
                <p className="text-xs text-gray-600">December 15, 2024</p>
              </div>
              <div className="border-l-4 border-fcc-gold-600 pl-3">
                <p className="text-sm font-medium text-gray-900">Women's Retreat</p>
                <p className="text-xs text-gray-600">December 20, 2024</p>
              </div>
              <div className="border-l-4 border-green-600 pl-3">
                <p className="text-sm font-medium text-gray-900">Prayer Night</p>
                <p className="text-xs text-gray-600">November 12, 2024</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}