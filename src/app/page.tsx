'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to dashboard
      window.location.href = '/dashboard';
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-fcc-blue-50 to-fcc-gold-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fcc-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fcc-blue-50 via-white to-fcc-gold-50">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full">
          <div className="text-center">
            {/* Logo */}
            <div className="mx-auto h-24 w-24 bg-fcc-gradient rounded-full flex items-center justify-center mb-8 shadow-lg">
              <span className="text-3xl font-bold text-white">FCC</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              <span className="fcc-gradient-text">Filadefia</span>{' '}
              <span className="text-gray-800">Christian Center</span>
            </h1>
            
            <h2 className="text-xl md:text-2xl text-gray-600 mb-2">
              Church Management System
            </h2>
            
            <p className="text-lg text-fcc-blue-600 font-medium mb-12">
              Tanzania Assemblies of God (TAG)
            </p>

            {/* Description */}
            <div className="max-w-2xl mx-auto mb-12">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Welcome to the FCC Church Management System - a comprehensive platform 
                designed to help manage our church community, departments, finances, 
                attendance, and events with efficiency and transparency.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="w-12 h-12 bg-fcc-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <div className="w-6 h-6 bg-fcc-blue-600 rounded"></div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Member Management</h3>
                  <p className="text-sm text-gray-600">
                    Register and manage church members with comprehensive profiles and department assignments
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="w-12 h-12 bg-fcc-gold-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <div className="w-6 h-6 bg-fcc-gold-600 rounded"></div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Financial Tracking</h3>
                  <p className="text-sm text-gray-600">
                    Track tithes, offerings, donations, and expenses with detailed reporting and analytics
                  </p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <div className="w-6 h-6 bg-green-600 rounded"></div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Department Management</h3>
                  <p className="text-sm text-gray-600">
                    Organize all 12 TAG departments with leadership, events, and communication tools
                  </p>
                </div>
              </div>
            </div>

            {/* Call to action */}
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white fcc-button-primary shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Sign In to System
              </Link>
              
              <Link
                href="/about"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border-2 border-fcc-blue-600 text-base font-medium rounded-lg text-fcc-blue-600 bg-white hover:bg-fcc-blue-50 transition-colors duration-200"
              >
                Learn More
              </Link>
            </div>

            {/* Contact info */}
            <div className="mt-16 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Need access to the system? Contact your church administrator.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
                <span>📧 info@fcc-tanzania.org</span>
                <span>📞 +255 XXX XXX XXX</span>
                <span>📍 Dar es Salaam, Tanzania</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
