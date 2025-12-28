'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth, AuthStatus } from '@/hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Users, DollarSign, BarChart3, Church, Chrome } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status } = useAuth();
  const supabase = createClient();

  // Redirect if already authenticated
  useEffect(() => {
    if (status === AuthStatus.AUTHENTICATED && user) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.replace(redirect);
    }
  }, [status, user, router, searchParams]);

  // Handle OAuth error from callback
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!supabase) {
        setError('System not available. Please try again later.');
        setLoading(false);
        return;
      }

      console.log('Attempting login for:', email);

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        // More user-friendly error messages
        if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please confirm your email address before logging in.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (!data.user || !data.session) {
        setError('Login failed. Please try again.');
        setLoading(false);
        return;
      }

      console.log('Login successful, user:', data.user.id);

      // Wait a moment for session to be established
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get user profile to determine role and department
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, department_id, first_name, last_name')
        .eq('user_id', data.user.id)
        .single();

      if (profileError) {
        console.log('Profile not found, will be created. Redirecting to dashboard...');
        // Profile will be created by AuthContext, redirect to dashboard
        window.location.href = '/dashboard';
        return;
      }

      console.log('User profile:', profile);

      // REDIRECT BASED ON ROLE
      if (profile.role === 'department_leader') {
        // Check if they have a department assigned
        let departmentId = profile.department_id;
        
        // If no department_id in profile, check departments table
        if (!departmentId && supabase) {
          const { data: deptData, error: deptError } = await supabase
            .from('departments')
            .select('id, name')
            .eq('leader_user_id', data.user.id)
            .eq('is_active', true)
            .single();

          if (deptData && !deptError) {
            departmentId = deptData.id;
          }
        }

        if (departmentId) {
          window.location.href = `/departments/${departmentId}`;
          return;
        }
      }

      // Default redirect for admins, pastors, or leaders without departments
      const redirect = searchParams.get('redirect') || '/dashboard';
      window.location.href = redirect;
    } catch (error: any) {
      console.error('Login exception:', error);
      if (error?.message?.includes('Failed to fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      if (!supabase) {
        setError('System not available. Please try again later.');
        setLoading(false);
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
      // Loading state will persist until redirect happens
    } catch (error) {
      setError('An unexpected error occurred with Google sign-in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 md:p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo - Centered */}
          <div className="mb-6 md:mb-8 text-center">
            <div className="flex flex-col items-center space-y-2 md:space-y-3 mb-4 md:mb-6">
              <div className="h-16 w-16 md:h-20 md:w-20 flex items-center justify-center">
                <img 
                  src="/tag-logo.png" 
                  alt="TAG Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Welcome!</h1>
                <p className="text-xs md:text-sm text-gray-600 mt-1">to FCC CHMS</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2 text-left">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 hover:border-gray-300"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-xs md:text-sm font-medium text-gray-700 mb-1.5 md:mb-2 text-left">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 md:pl-12 pr-10 md:pr-12 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 hover:border-gray-300"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs md:text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <Link
                href="/forgot-password"
                className="text-xs md:text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 md:px-4 py-2 rounded-xl flex items-center space-x-2">
                <span className="text-xs md:text-sm">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-2 md:py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm md:text-base font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 md:mt-8 text-center">
            <p className="text-xs md:text-sm text-gray-600">
              Need access?{' '}
              <span className="font-medium text-blue-600">
                Contact your administrator
              </span>
            </p>
          </div>

          <div className="mt-4 md:mt-8 pt-3 md:pt-6 border-t border-gray-200 text-center">
            <p className="text-[10px] md:text-xs text-gray-500">
              © 2025 Filadefia Christian Center. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Church Background */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Church Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1507692049790-de58290a4334?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80')`,
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/85 via-blue-800/90 to-blue-900/85"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl"></div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-center p-12">
          <div className="max-w-md text-white text-center">
            {/* Church Icon */}
            <div className="mb-8">
              <Church className="h-16 w-16 text-white/90 mx-auto" />
            </div>
            
            <h2 className="text-4xl font-bold mb-6">
              Modern Church<br />Management System
            </h2>
            <p className="text-lg text-blue-100 mb-8">
              Streamline your church operations with our comprehensive management platform designed specifically for TAG churches in Tanzania.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">Member Management</p>
                  <p className="text-sm text-blue-100">Comprehensive member profiles & tracking</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">Financial Tracking</p>
                  <p className="text-sm text-blue-100">Tithes, offerings & expense management</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">Analytics & Reports</p>
                  <p className="text-sm text-blue-100">Detailed insights & automated reporting</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}