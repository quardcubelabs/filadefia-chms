'use client';

// Prevent SSR/prerendering issues during build
export const dynamic = 'force-dynamic';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, Button, Input, Select, Modal } from '@/components/ui';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  Camera, 
  Settings,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Edit,
  Save,
  X,
  Upload,
  Trash2,
  Key,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export default function SettingsPage() {
  const { user, loading: authLoading, signOut, supabase } = useAuth();
  const [darkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Profile edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    phone: '',
    bio: '',
    address: '',
    emergency_contact: '',
    emergency_phone: '',
  });

  // Settings states
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      events: true,
      finances: true,
      announcements: true,
    },
    privacy: {
      profileVisible: true,
      showEmail: false,
      showPhone: false,
    },
    appearance: {
      theme: 'light',
      language: 'en',
    },
    security: {
      twoFactorEnabled: false,
      loginNotifications: true,
    }
  });

  // Photo upload states
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Password change states
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [stats, setStats] = useState({
    totalContributions: 0,
    totalEvents: 0,
    memberSince: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
    if (user && supabase) {
      loadUserStats();
      loadUserSettings();
      const profile = user.profile;
      if (profile) {
        setEditedProfile({
          name: profile.name || '',
          phone: profile.phone || '',
          bio: profile.bio || '',
          address: profile.address || '',
          emergency_contact: profile.emergency_contact || '',
          emergency_phone: profile.emergency_phone || '',
        });
      }
    }
  }, [user, authLoading]);

  const loadUserStats = async () => {
    if (!user?.profile?.id) return;
    
    try {
      if (!supabase) return;
      const { data: contributions } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('member_id', user.profile.id)
        .eq('transaction_type', 'offering');

      if (!supabase) return;
      const { data: events } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('member_id', user.profile.id);

      setStats({
        totalContributions: contributions?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0,
        totalEvents: events?.length || 0,
        memberSince: user.profile?.created_at ? new Date(user.profile.created_at).getFullYear().toString() : 'N/A',
      });
    } catch (error: any) {
      console.error('Error loading user stats:', error);
      
      // Handle JWT expired errors
      if (error.message && error.message.includes('JWT expired')) {
        console.log('JWT token expired during settings data fetch');
        await signOut();
        window.location.href = '/login';
        return;
      }
    }
  };

  const loadUserSettings = async () => {
    if (!user?.id) return;
    
    try {
      if (!supabase) return;
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSettings(prev => ({
          ...prev,
          notifications: { ...prev.notifications, ...data.notifications },
          privacy: { ...prev.privacy, ...data.privacy },
          appearance: { ...prev.appearance, ...data.appearance },
          security: { ...prev.security, ...data.security },
        }));
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedPhoto || !user?.profile?.id) return;

    try {
      setIsSaving(true);
      setUploadProgress(0);

      // Check user permissions first
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      console.log('Upload attempt by user:', userData?.user?.id, 'Role:', user?.profile?.role);

      // Upload to Supabase Storage
      const fileExt = selectedPhoto.name.split('.').pop();
      const fileName = `${user.profile.id}-${Date.now()}.${fileExt}`;
      
      console.log('Uploading to profile-photos bucket:', fileName);
      
      if (!supabase) return;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, selectedPhoto);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        if (uploadError.message.includes('row-level security')) {
          throw new Error('Storage access denied. The "profile-photos" bucket may not exist or lacks proper permissions.');
        }
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);
      setUploadProgress(50);

      // Get public URL
      if (!supabase) return;
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);
      setUploadProgress(75);

      // Update profile in the correct table (profiles, not user_profiles)
      if (!supabase) return;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.profile.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      setUploadProgress(100);
      setMessage({ type: 'success', text: 'Profile photo updated successfully!' });
      setShowPhotoModal(false);
      setSelectedPhoto(null);
      setPhotoPreview(null);
      
      // Refresh auth to get updated profile
      window.location.reload();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      const errorMsg = error.message || 'Unknown error occurred';
      setMessage({ 
        type: 'error', 
        text: `Failed to update profile photo: ${errorMsg}. Check console for details.` 
      });
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user?.profile?.id) return;

    try {
      setIsSaving(true);
      
      if (!supabase) return;
      const { error } = await supabase
        .from('user_profiles')
        .update(editedProfile)
        .eq('id', user.profile.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingsUpdate = async (section: string, key: string, value: any) => {
    try {
      const newSettings = { ...settings };
      (newSettings as any)[section][key] = value;
      setSettings(newSettings);

      // Save to database
      if (!supabase) return;
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          [section]: (newSettings as any)[section]
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Settings updated successfully!' });
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ type: 'error', text: 'Failed to update settings.' });
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (passwords.new.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    try {
      setIsSaving(true);
      
      if (!supabase) return;
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setShowPasswordModal(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage({ type: 'error', text: 'Failed to update password.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB.' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file.' });
      return;
    }

    setSelectedPhoto(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const profile = user?.profile;
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Settings },
  ];

  return (
    <MainLayout
      title="Settings"
      subtitle="Manage your account and preferences"
    >
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">

        {/* Message Alert */}
        {message && (
          <div className={`p-3 sm:p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start sm:items-center">
              {message.type === 'success' ? 
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 mt-0.5 sm:mt-0 flex-shrink-0" /> :
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 mt-0.5 sm:mt-0 flex-shrink-0" />
              }
              <span className={`text-sm sm:text-base flex-1 ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {message.text}
              </span>
              <button 
                onClick={() => setMessage(null)}
                className="ml-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation - Mobile responsive */}
        <Card className={`${cardBg} p-0 overflow-x-auto`}>
          <nav className="flex space-x-0 min-w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-3 font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-red-100 text-red-600 rounded-tl-lg'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600"></div>
                )}
              </button>
            ))}
          </nav>
        </Card>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <Card className={`${cardBg} p-3 sm:p-4 md:p-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
              <h2 className={`text-lg sm:text-xl font-semibold ${textPrimary}`}>Profile Information</h2>
              <Button
                onClick={() => isEditing ? handleProfileUpdate() : setIsEditing(true)}
                disabled={isSaving}
                className="flex items-center space-x-1 sm:space-x-2 text-sm"
                size="sm"
              >
                {isEditing ? <Save className="w-3 h-3 sm:w-4 sm:h-4" /> : <Edit className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span>{isEditing ? (isSaving ? 'Saving...' : 'Save') : 'Edit'}</span>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-4 sm:mb-6">
              {/* Profile Picture */}
              <div className="relative group mx-auto sm:mx-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-200">
                  <img
                    src={
                      profile?.photo_url || 
                      user?.user_metadata?.avatar_url || 
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || user?.email || '')}&background=3b82f6&color=fff&size=200`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button 
                  onClick={() => setShowPhotoModal(true)}
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>

              {/* Quick Stats */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className={`text-xl sm:text-2xl font-bold ${textPrimary}`}>${stats.totalContributions}</p>
                  <p className={`text-xs sm:text-sm ${textSecondary}`}>Total Contributions</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className={`text-xl sm:text-2xl font-bold ${textPrimary}`}>{stats.totalEvents}</p>
                  <p className={`text-xs sm:text-sm ${textSecondary}`}>Events Attended</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className={`text-xl sm:text-2xl font-bold ${textPrimary}`}>{stats.memberSince}</p>
                  <p className={`text-xs sm:text-sm ${textSecondary}`}>Member Since</p>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className={`block text-xs sm:text-sm font-medium ${textPrimary} mb-1 sm:mb-2`}>Full Name</label>
                <Input
                  value={isEditing ? editedProfile.name : (profile?.name || '')}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Enter your full name"
                  className="text-sm"
                />
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-medium ${textPrimary} mb-1 sm:mb-2`}>Email</label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-100 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Email is managed by Google</p>
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-medium ${textPrimary} mb-1 sm:mb-2`}>Phone</label>
                <Input
                  value={isEditing ? editedProfile.phone : (profile?.phone || '')}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Enter your phone number"
                  className="text-sm"
                />
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-medium ${textPrimary} mb-1 sm:mb-2`}>Role</label>
                <Input
                  value={profile?.role || 'Member'}
                  disabled
                  className="bg-gray-100 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block text-xs sm:text-sm font-medium ${textPrimary} mb-1 sm:mb-2`}>Address</label>
                <Input
                  value={isEditing ? editedProfile.address : (profile?.address || '')}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Enter your address"
                  className="text-sm"
                />
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-medium ${textPrimary} mb-1 sm:mb-2`}>Emergency Contact</label>
                <Input
                  value={isEditing ? editedProfile.emergency_contact : (profile?.emergency_contact || '')}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, emergency_contact: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Emergency contact name"
                  className="text-sm"
                />
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-medium ${textPrimary} mb-1 sm:mb-2`}>Emergency Phone</label>
                <Input
                  value={isEditing ? editedProfile.emergency_phone : (profile?.emergency_phone || '')}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, emergency_phone: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Emergency contact phone"
                  className="text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className={`block text-xs sm:text-sm font-medium ${textPrimary} mb-1 sm:mb-2`}>Bio</label>
                <textarea
                  value={isEditing ? editedProfile.bio : (profile?.bio || '')}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50 disabled:bg-gray-100"
                />
              </div>
            </div>
            </Card>
          )}

        {activeTab === 'notifications' && (
          <Card className={`${cardBg} p-3 sm:p-4 md:p-6`}>
            <h2 className={`text-lg sm:text-xl font-semibold ${textPrimary} mb-4 sm:mb-6`}>Notification Preferences</h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex-1">
                  <h3 className={`font-medium text-sm sm:text-base ${textPrimary}`}>Email Notifications</h3>
                  <p className={`text-xs sm:text-sm ${textSecondary}`}>Receive notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={settings.notifications.email}
                    onChange={(e) => handleSettingsUpdate('notifications', 'email', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex-1">
                  <h3 className={`font-medium text-sm sm:text-base ${textPrimary}`}>Push Notifications</h3>
                  <p className={`text-xs sm:text-sm ${textSecondary}`}>Receive push notifications on your device</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={settings.notifications.push}
                    onChange={(e) => handleSettingsUpdate('notifications', 'push', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex-1">
                  <h3 className={`font-medium text-sm sm:text-base ${textPrimary}`}>Event Notifications</h3>
                  <p className={`text-xs sm:text-sm ${textSecondary}`}>Get notified about church events</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={settings.notifications.events}
                    onChange={(e) => handleSettingsUpdate('notifications', 'events', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex-1">
                  <h3 className={`font-medium text-sm sm:text-base ${textPrimary}`}>Financial Updates</h3>
                  <p className={`text-xs sm:text-sm ${textSecondary}`}>Notifications about offerings and financial reports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={settings.notifications.finances}
                    onChange={(e) => handleSettingsUpdate('notifications', 'finances', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex-1">
                  <h3 className={`font-medium text-sm sm:text-base ${textPrimary}`}>Announcements</h3>
                  <p className={`text-xs sm:text-sm ${textSecondary}`}>Important church announcements</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={settings.notifications.announcements}
                    onChange={(e) => handleSettingsUpdate('notifications', 'announcements', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              </div>
            </Card>
          )}

        {activeTab === 'privacy' && (
          <Card className={`${cardBg} p-3 sm:p-4 md:p-6`}>
            <h2 className={`text-lg sm:text-xl font-semibold ${textPrimary} mb-4 sm:mb-6`}>Privacy Settings</h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex-1">
                  <h3 className={`font-medium text-sm sm:text-base ${textPrimary}`}>Profile Visibility</h3>
                  <p className={`text-xs sm:text-sm ${textSecondary}`}>Allow other members to see your profile</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={settings.privacy.profileVisible}
                    onChange={(e) => handleSettingsUpdate('privacy', 'profileVisible', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex-1">
                  <h3 className={`font-medium text-sm sm:text-base ${textPrimary}`}>Show Email</h3>
                  <p className={`text-xs sm:text-sm ${textSecondary}`}>Display your email to other members</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={settings.privacy.showEmail}
                    onChange={(e) => handleSettingsUpdate('privacy', 'showEmail', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex-1">
                  <h3 className={`font-medium text-sm sm:text-base ${textPrimary}`}>Show Phone</h3>
                  <p className={`text-xs sm:text-sm ${textSecondary}`}>Display your phone number to other members</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={settings.privacy.showPhone}
                    onChange={(e) => handleSettingsUpdate('privacy', 'showPhone', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              </div>
            </Card>
          )}

        {activeTab === 'security' && (
          <Card className={`${cardBg} p-3 sm:p-4 md:p-6`}>
            <h2 className={`text-lg sm:text-xl font-semibold ${textPrimary} mb-4 sm:mb-6`}>Security Settings</h2>
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex-1">
                  <h3 className={`font-medium text-sm sm:text-base ${textPrimary}`}>Change Password</h3>
                  <p className={`text-xs sm:text-sm ${textSecondary}`}>Update your account password</p>
                </div>
                <Button 
                  onClick={() => setShowPasswordModal(true)}
                  size="sm"
                  className="text-sm self-start sm:self-auto"
                >
                  <span className="hidden sm:inline">Change Password</span>
                  <span className="sm:hidden">Change</span>
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex-1">
                  <h3 className={`font-medium text-sm sm:text-base ${textPrimary}`}>Login Notifications</h3>
                  <p className={`text-xs sm:text-sm ${textSecondary}`}>Get notified when someone logs into your account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={settings.security.loginNotifications}
                    onChange={(e) => handleSettingsUpdate('security', 'loginNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <div className="border-t pt-3 sm:pt-4">
                <h3 className={`font-medium text-sm sm:text-base ${textPrimary} mb-3 sm:mb-4`}>Account Actions</h3>
                <div className="space-y-2 sm:space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => signOut()}
                    className="w-full justify-start text-sm"
                    size="sm"
                  >
                    <Key className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="hidden sm:inline">Sign Out of All Devices</span>
                    <span className="sm:hidden">Sign Out All</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full justify-start text-red-600 border-red-300 hover:bg-red-50 text-sm"
                    size="sm"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
              </div>
            </Card>
          )}

        {activeTab === 'appearance' && (
          <Card className={`${cardBg} p-3 sm:p-4 md:p-6`}>
            <h2 className={`text-lg sm:text-xl font-semibold ${textPrimary} mb-4 sm:mb-6`}>Appearance Settings</h2>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className={`block text-xs sm:text-sm font-medium ${textPrimary} mb-1 sm:mb-2`}>Theme</label>
                <Select
                  value={settings.appearance.theme}
                  onChange={(value) => handleSettingsUpdate('appearance', 'theme', value)}
                  options={[
                    { value: 'light', label: 'Light' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'system', label: 'System' }
                  ]}
                  className="text-sm"
                />
              </div>

              <div>
                <label className={`block text-xs sm:text-sm font-medium ${textPrimary} mb-1 sm:mb-2`}>Language</label>
                <Select
                  value={settings.appearance.language}
                  onChange={(value) => handleSettingsUpdate('appearance', 'language', value)}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Español' },
                    { value: 'fr', label: 'Français' }
                  ]}
                  className="text-sm"
                />
              </div>
              </div>
            </Card>
          )}

          {/* Photo Upload Modal */}
          {showPhotoModal && (
            <Modal isOpen={showPhotoModal} onClose={() => setShowPhotoModal(false)}>
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Change Profile Photo</h2>
                
                <div className="mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload photo</span>
                    <span className="text-xs text-gray-500">Max 5MB, JPG, PNG, GIF</span>
                  </label>
                </div>

                {photoPreview && (
                  <div className="mb-4">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-full mx-auto"
                    />
                  </div>
                )}

                {uploadProgress > 0 && (
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{uploadProgress}% uploaded</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPhotoModal(false);
                      setSelectedPhoto(null);
                      setPhotoPreview(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePhotoUpload}
                    disabled={!selectedPhoto || isSaving}
                  >
                    {isSaving ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </Modal>
          )}

          {/* Password Change Modal */}
          {showPasswordModal && (
            <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)}>
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Change Password</h2>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwords.confirm}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswords({ current: '', new: '', confirm: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={!passwords.current || !passwords.new || !passwords.confirm || isSaving}
                  >
                    {isSaving ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </div>
            </Modal>
          )}

          {/* Delete Account Modal */}
          {showDeleteModal && (
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
              <div className="p-6">
                <h2 className="text-xl font-bold text-red-600 mb-4">Delete Account</h2>
                <p className="text-gray-600 mb-6">
                  This action cannot be undone. Your account and all associated data will be permanently deleted.
                </p>
                
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      // Handle account deletion
                      setShowDeleteModal(false);
                      setMessage({ type: 'error', text: 'Account deletion is not available yet. Please contact support.' });
                    }}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </Modal>
          )}
      </div>
    </MainLayout>
  );
}