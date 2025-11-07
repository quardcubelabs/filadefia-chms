'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { ArrowRight, Users, DollarSign, Calendar, BarChart3, MessageSquare, Shield, CheckCircle, Star, TrendingUp } from 'lucide-react';

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-11 w-11 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center shadow-lg p-1">
                <img 
                  src="/tag-logo.png" 
                  alt="TAG Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">FCC CHMS</h1>
                <p className="text-xs text-gray-500">Tanzania Assemblies of God</p>
              </div>
            </div>
            <nav className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-fcc-blue-600 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-6 py-2.5 bg-gradient-to-r from-fcc-blue-600 to-fcc-blue-700 text-white rounded-xl hover:shadow-lg transition-all flex items-center space-x-2 font-medium"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-fcc-blue-50 via-white to-blue-50 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-fcc-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-fcc-gold-200/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-fcc-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4 fill-current" />
              <span>Modern Church Management Platform</span>
            </div>

            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Empower Your Church
              <br />
              <span className="bg-gradient-to-r from-fcc-blue-600 via-fcc-blue-700 to-fcc-gold-600 bg-clip-text text-transparent">
                With Smart Management
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Streamline operations, track attendance, manage finances, and engage your congregation with our comprehensive church management system designed for Tanzania Assemblies of God.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link
                href="/login"
                className="px-8 py-4 bg-gradient-to-r from-fcc-blue-600 to-fcc-blue-700 text-white rounded-xl hover:shadow-xl transition-all flex items-center justify-center space-x-2 font-medium text-lg"
              >
                <span>Access Dashboard</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/setup"
                className="px-8 py-4 bg-white text-fcc-blue-600 border-2 border-fcc-blue-200 rounded-xl hover:border-fcc-blue-400 hover:shadow-lg transition-all font-medium text-lg"
              >
                View Demo
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
              <div>
                <div className="text-3xl font-bold text-fcc-blue-600">12</div>
                <div className="text-sm text-gray-600 mt-1">TAG Departments</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-fcc-blue-600">100%</div>
                <div className="text-sm text-gray-600 mt-1">Secure & Private</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-fcc-blue-600">24/7</div>
                <div className="text-sm text-gray-600 mt-1">Cloud Access</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Church
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for church administration and community engagement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-fcc-blue-300 transition-all">
              <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Member Management</h4>
              <p className="text-gray-600 leading-relaxed">
                Comprehensive member profiles, attendance tracking, and department management for all 12 TAG departments with detailed analytics.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-fcc-blue-300 transition-all">
              <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Financial Tracking</h4>
              <p className="text-gray-600 leading-relaxed">
                Track tithes, offerings, pledges, and expenses with detailed reports and mobile money integration for M-Pesa, Tigo Pesa, and Airtel Money.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-fcc-blue-300 transition-all">
              <div className="h-14 w-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Event Management</h4>
              <p className="text-gray-600 leading-relaxed">
                Organize services, conferences, and special events with online registration, attendance tracking, and automated reminders.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-fcc-blue-300 transition-all">
              <div className="h-14 w-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Analytics & Reports</h4>
              <p className="text-gray-600 leading-relaxed">
                Generate detailed reports on attendance, finances, growth trends, and department activities with beautiful visualizations.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-fcc-blue-300 transition-all">
              <div className="h-14 w-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-7 w-7 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Communication Hub</h4>
              <p className="text-gray-600 leading-relaxed">
                Send announcements and messages via SMS, Email, and WhatsApp to members, departments, or the entire congregation instantly.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:border-fcc-blue-300 transition-all">
              <div className="h-14 w-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Role-Based Access</h4>
              <p className="text-gray-600 leading-relaxed">
                Secure access control with dedicated roles for administrators, pastors, treasurers, secretaries, and department leaders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              All TAG Departments Supported
            </h3>
            <p className="text-lg text-gray-600">
              Complete management tools for all 12 Tanzania Assemblies of God departments
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: 'Youth Ministry', swahili: 'VIJANA' },
              { name: 'Women\'s Ministry', swahili: 'WAWATA' },
              { name: 'Men\'s Ministry', swahili: 'WAUME' },
              { name: 'Sunday School', swahili: 'SHULE YA JUMAPILI' },
              { name: 'Children\'s Ministry', swahili: 'WATOTO' },
              { name: 'Choir', swahili: 'KWAYA' },
              { name: 'Evangelism', swahili: 'MISHENI' },
              { name: 'Prayer Ministry', swahili: 'SALA' },
              { name: 'Ushers', swahili: 'WAONGOZAJI' },
              { name: 'Media Ministry', swahili: 'MEDIA' },
              { name: 'Welfare', swahili: 'USTAWI' },
              { name: 'Education', swahili: 'ELIMU' }
            ].map((dept, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-fcc-blue-300 transition-all group"
              >
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-fcc-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm group-hover:text-fcc-blue-600 transition-colors">
                      {dept.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{dept.swahili}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-fcc-blue-600 via-fcc-blue-700 to-fcc-blue-900 rounded-3xl p-12 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-fcc-gold-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 text-center text-white">
              <TrendingUp className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Church Management?
              </h3>
              <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                Join modern churches using our platform to streamline operations and engage their congregation effectively.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-fcc-blue-600 rounded-xl hover:shadow-xl transition-all font-medium text-lg"
              >
                <span>Get Started Today</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 bg-gradient-to-br from-fcc-blue-600 to-fcc-blue-700 rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold">F</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg">FCC System</h4>
                  <p className="text-sm text-gray-400">Church Management</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Modern church management platform designed for Tanzania Assemblies of God churches.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/setup" className="hover:text-white transition-colors">Setup Guide</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-sm text-gray-400">
                Filadefia Christian Center<br />
                Tanzania Assemblies of God (TAG)<br />
                Dar es Salaam, Tanzania
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2025 Filadefia Christian Center. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
