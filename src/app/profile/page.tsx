'use client';

// Prevent SSR/prerendering issues during build
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import { Button, Input, TextArea, Alert, Card, CardBody } from '@/components/ui';
import {
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  User
} from 'lucide-react';

export default function ProfilePage() {
  const { user, supabase } = useAuth();
  
  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (user?.profile) {
      setProfileForm({
        first_name: user.profile.first_name || '',
        last_name: user.profile.last_name || '',
        email: user.email || '',
        phone: user.profile.phone || '',
        address: user.profile.address || '',
        bio: user.profile.bio || '',
        avatar_url: user.profile.avatar_url || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!supabase || !user?.profile?.id) return;

    try {
      setLoading(true);
      setMessage(null);

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          phone: profileForm.phone,
          address: profileForm.address,
          bio: profileForm.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.profile.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user?.profile) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-3 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Profile</h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base hidden sm:block">Manage your personal information and account settings</p>
              </div>
              <div className="flex space-x-2 sm:space-x-3">
                {!isEditing ? (
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    icon={<Edit className="h-4 w-4" />}
                    size="sm"
                    className="text-sm"
                  >
                    <span className="hidden sm:inline">Edit Profile</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)} 
                      icon={<X className="h-4 w-4" />}
                      size="sm"
                      className="text-sm"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleProfileUpdate} 
                      loading={loading} 
                      icon={<Save className="h-4 w-4" />}
                      size="sm"
                      className="text-sm"
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {message && (
              <Alert variant={message.type} className="mb-4 sm:mb-6">
                {message.text}
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {/* Profile Picture Card */}
              <Card>
                <CardBody className="text-center p-4 sm:p-6">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl sm:text-4xl font-bold mx-auto mb-3 sm:mb-4">
                    {profileForm.first_name?.charAt(0)}{profileForm.last_name?.charAt(0)}
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900 mb-1 sm:mb-2">
                    {profileForm.first_name} {profileForm.last_name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 capitalize">
                    {user.profile.role?.replace('_', ' ')}
                  </p>
                  {isEditing && (
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                      <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Change Photo</span>
                      <span className="sm:hidden">Photo</span>
                    </Button>
                  )}
                </CardBody>
              </Card>

              {/* Profile Information Card */}
              <div className="lg:col-span-2">
                <Card>
                  <CardBody className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Personal Information</h3>
                    
                    <div className="space-y-4 sm:space-y-6">
                      {/* Name */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">First Name</label>
                          {isEditing ? (
                            <Input
                              value={profileForm.first_name}
                              onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                              required
                              className="text-sm"
                            />
                          ) : (
                            <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md text-sm">
                              {profileForm.first_name || 'Not provided'}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          {isEditing ? (
                            <Input
                              value={profileForm.last_name}
                              onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                              required
                              className="text-sm"
                            />
                          ) : (
                            <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md text-sm">
                              {profileForm.last_name || 'Not provided'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                          <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md flex-1 text-sm">
                            {profileForm.email || 'Not provided'}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        {isEditing ? (
                          <Input
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            placeholder="+255 XXX XXX XXX"
                            icon={<Phone className="h-4 w-4" />}
                            className="text-sm"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md flex-1 text-sm">
                              {profileForm.phone || 'Not provided'}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address</label>
                        {isEditing ? (
                          <Input
                            value={profileForm.address}
                            onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                            placeholder="Your address"
                            icon={<MapPin className="h-4 w-4" />}
                            className="text-sm"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md flex-1 text-sm">
                              {profileForm.address || 'Not provided'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Bio */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        {isEditing ? (
                          <TextArea
                            value={profileForm.bio}
                            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                            placeholder="Tell us about yourself..."
                            rows={4}
                          />
                        ) : (
                          <p className="text-gray-900 py-2 px-3 bg-gray-50 rounded-md min-h-[100px]">
                            {profileForm.bio || 'No bio provided'}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Account Information Card */}
                <Card className="mt-6">
                  <CardBody>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Shield className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Role</p>
                          <p className="font-medium capitalize">{user.profile.role?.replace('_', ' ')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Member Since</p>
                          <p className="font-medium">
                            {new Date(user.profile.created_at || '').toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Account Status</p>
                          <p className="font-medium text-green-600">Active</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Calendar className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Last Updated</p>
                          <p className="font-medium">
                            {user.profile.updated_at 
                              ? new Date(user.profile.updated_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : 'Never'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}