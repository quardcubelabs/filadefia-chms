'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  User,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface UserDropdownProps {
  darkMode?: boolean;
}

export default function UserDropdown({ darkMode = false }: UserDropdownProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user?.profile) {
    return null;
  }

  const displayName = user.profile.first_name && user.profile.last_name 
    ? `${user.profile.first_name} ${user.profile.last_name}`
    : user.email?.split('@')[0] || 'User';

  const initials = user.profile.first_name && user.profile.last_name
    ? `${user.profile.first_name.charAt(0)}${user.profile.last_name.charAt(0)}`
    : displayName.charAt(0).toUpperCase();

  return (
    <div className="relative">
      {/* User Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
          darkMode 
            ? 'hover:bg-gray-700 text-white' 
            : 'hover:bg-gray-100 text-gray-900'
        }`}
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
          {initials}
        </div>
        
        {/* Name and Role */}
        <div className="text-left">
          <p className="text-sm font-medium">{displayName}</p>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} capitalize`}>
            {user.profile.role?.replace('_', ' ')}
          </p>
        </div>
        
        {/* Chevron */}
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Menu */}
          <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-20 ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border`}>
            <div className="py-1">
              {/* View Profile */}
              <Link
                href="/profile"
                className={`flex items-center px-4 py-2 text-sm transition-colors ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-red-900 hover:text-white' 
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-700'
                }`}
                onClick={() => setShowDropdown(false)}
              >
                <User className="w-4 h-4 mr-3" />
                View Profile
              </Link>

              {/* Settings */}
              <Link
                href="/settings"
                className={`flex items-center px-4 py-2 text-sm transition-colors ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-red-900 hover:text-white' 
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-700'
                }`}
                onClick={() => setShowDropdown(false)}
              >
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </Link>

              {/* Divider */}
              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} my-1`} />

              {/* Sign Out */}
              <button
                onClick={() => {
                  setShowDropdown(false);
                  handleSignOut();
                }}
                className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                  darkMode 
                    ? 'text-gray-300 hover:bg-red-900 hover:text-white' 
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-700'
                }`}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}