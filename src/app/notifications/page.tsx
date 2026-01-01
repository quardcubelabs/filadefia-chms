'use client';

import { useEffect, useState } from 'react';

// Prevent SSR/prerendering issues during build
export const dynamic = 'force-dynamic';

import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import { EmptyState, Button, Card, Badge, Modal, Input, Select } from '@/components/ui';
import MainLayout from '@/components/MainLayout';
import { 
  Bell, 
  Calendar, 
  DollarSign, 
  Users, 
  FileText, 
  MessageSquare, 
  Settings, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter,
  Search,
  BellOff,
  Volume2,
  VolumeX
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'announcement' | 'event' | 'finance' | 'member' | 'document' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  created_at: string;
  related_id?: string;
  related_type?: string;
  action_url?: string;
}

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  announcement_notifications: boolean;
  event_notifications: boolean;
  finance_notifications: boolean;
  member_notifications: boolean;
  document_notifications: boolean;
  system_notifications: boolean;
}

export default function NotificationsPage() {
  const { user, loading: authLoading, supabase, signOut } = useAuth();
  const { isDepartmentLeader, departmentId, departmentName } = useDepartmentAccess();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: true,
    announcement_notifications: true,
    event_notifications: true,
    finance_notifications: true,
    member_notifications: true,
    document_notifications: true,
    system_notifications: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user && supabase) {
      fetchNotifications();
      fetchPreferences();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, 
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Generate mock notifications for demo
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'announcement',
          title: 'Church Service Update',
          message: 'Sunday service time has been changed to 10:30 AM starting next week.',
          priority: 'high',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          action_url: '/messages'
        },
        {
          id: '2',
          type: 'event',
          title: 'Youth Camp Registration',
          message: 'Registration for the annual youth camp is now open. Limited spots available.',
          priority: 'medium',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          action_url: '/events'
        },
        {
          id: '3',
          type: 'finance',
          title: 'Monthly Tithe Report',
          message: 'Your tithe contribution report for this month is ready for review.',
          priority: 'low',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          action_url: '/finance'
        },
        {
          id: '4',
          type: 'member',
          title: 'New Member Welcome',
          message: 'Please welcome our new members who joined the church this week.',
          priority: 'medium',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          action_url: '/members'
        },
        {
          id: '5',
          type: 'document',
          title: 'Meeting Minutes Available',
          message: 'The board meeting minutes from last week are now available for review.',
          priority: 'low',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
          action_url: '/documents'
        },
        {
          id: '6',
          type: 'system',
          title: 'Profile Update Required',
          message: 'Please update your contact information in your profile.',
          priority: 'urgent',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
          action_url: '/settings'
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      // In a real app, fetch from database
      // For now, use localStorage
      const saved = localStorage.getItem('notification_preferences');
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const updatePreferences = async () => {
    try {
      localStorage.setItem('notification_preferences', JSON.stringify(preferences));
      setShowSettings(false);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return <MessageSquare className="w-5 h-5" />;
      case 'event': return <Calendar className="w-5 h-5" />;
      case 'finance': return <DollarSign className="w-5 h-5" />;
      case 'member': return <Users className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      case 'system': return <Settings className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'read' && notification.read) || 
      (filter === 'unread' && !notification.read);
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesType && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fcc-blue-600"></div>
      </div>
    );
  }

  return (
    <MainLayout
      title="Notifications"
      subtitle={unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6 justify-end">
          {unreadCount > 0 && (
            <Button 
              className="bg-red-100 border border-red-600 text-red-700 hover:bg-red-200 text-xs sm:text-sm" 
              onClick={markAllAsRead}
              size="sm"
            >
              <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Mark All Read</span>
              <span className="sm:hidden">Read All</span>
            </Button>
          )}
          <Button 
            className="bg-red-100 border border-red-600 text-red-700 hover:bg-red-200 text-xs sm:text-sm" 
            onClick={() => setShowSettings(true)}
            size="sm"
          >
            <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Config</span>
          </Button>
          {notifications.length > 0 && (
            <Button 
              className="bg-red-100 border border-red-600 text-red-700 hover:bg-red-200 text-xs sm:text-sm" 
              onClick={clearAllNotifications}
              size="sm"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Clear All</span>
              <span className="sm:hidden">Clear</span>
            </Button>
          )}
        </div>

        {/* Department Access Notification */}
        {isDepartmentLeader && departmentName && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start sm:items-center">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2 sm:mr-3 mt-0.5 sm:mt-0 flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="font-medium text-blue-900 text-sm sm:text-base">Department Notifications: {departmentName}</h3>
                <p className="text-blue-700 text-xs sm:text-sm mt-1">
                  You'll receive notifications related to your department activities and system-wide announcements.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <div className="flex-1 min-w-0 sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 w-3 h-3 sm:w-4 sm:h-4" />
                <Input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 border-red-300 focus:border-red-500 focus:ring-red-500 focus:ring-2 bg-red-50 focus:outline-none text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
                options={[
                  { value: "all", label: "All Notifications" },
                  { value: "unread", label: "Unread Only" },
                  { value: "read", label: "Read Only" }
                ]}
                className="border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50 text-sm"
              />
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { value: "all", label: "All Types" },
                  { value: "announcement", label: "Announcements" },
                  { value: "event", label: "Events" },
                  { value: "finance", label: "Finance" },
                  { value: "member", label: "Members" },
                  { value: "document", label: "Documents" },
                  { value: "system", label: "System" }
                ]}
                className="border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50 text-sm"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 md:p-12">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-fcc-blue-600 mx-auto"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 md:p-12">
            <EmptyState
              icon={<Bell className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />}
              title="No Notifications"
              description={searchTerm || filter !== 'all' || typeFilter !== 'all' 
                ? "No notifications match your current filters." 
                : "You're all caught up! No new notifications."}
            />
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredNotifications.map((notification) => (
              <Card key={notification.id} className={`p-3 sm:p-4 md:p-6 transition-all duration-200 ${
                !notification.read ? 'bg-blue-50 border-blue-200' : 'hover:shadow-md'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2 sm:space-x-3 md:space-x-4 flex-1 min-w-0">
                    <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${
                      !notification.read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5">
                        {getTypeIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                        <h3 className={`font-semibold text-sm sm:text-base truncate ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </Badge>
                          {!notification.read && (
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2 sm:mb-3 text-xs sm:text-sm leading-relaxed">{notification.message}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                        <span className="text-xs sm:text-sm text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                        <div className="flex items-center gap-1 sm:gap-2">
                          {notification.action_url && (
                            <Button 
                              size="sm"
                              className="bg-red-100 border border-red-600 text-red-700 hover:bg-red-200 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5"
                              onClick={() => {
                                if (!notification.read) {
                                  markAsRead(notification.id);
                                }
                                window.location.href = notification.action_url!;
                              }}
                            >
                              <span className="hidden sm:inline">View Details</span>
                              <span className="sm:hidden">View</span>
                            </Button>
                          )}
                          {!notification.read && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 sm:p-2"
                            >
                              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-700 p-1 sm:p-2"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Settings Modal */}
        <Modal isOpen={showSettings} onClose={() => setShowSettings(false)}>
          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Notification Settings</h2>
            
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Delivery Methods</h3>
                <div className="space-y-2 sm:space-y-3">
                  <label className="flex items-center space-x-2 sm:space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.email_notifications}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        email_notifications: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-fcc-blue-600 focus:ring-fcc-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                      <span className="text-sm sm:text-base">Email Notifications</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 sm:space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.push_notifications}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        push_notifications: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-fcc-blue-600 focus:ring-fcc-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                      <span className="text-sm sm:text-base">Push Notifications</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Notification Types</h3>
                <div className="space-y-2 sm:space-y-3">
                  <label className="flex items-center space-x-2 sm:space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.announcement_notifications}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        announcement_notifications: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-fcc-blue-600 focus:ring-fcc-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                      <span className="text-sm sm:text-base">Announcements</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 sm:space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.event_notifications}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        event_notifications: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-fcc-blue-600 focus:ring-fcc-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                      <span className="text-sm sm:text-base">Events</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 sm:space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.finance_notifications}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        finance_notifications: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-fcc-blue-600 focus:ring-fcc-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                      <span className="text-sm sm:text-base">Finance</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 sm:space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.member_notifications}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        member_notifications: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-fcc-blue-600 focus:ring-fcc-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                      <span className="text-sm sm:text-base">Member Updates</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 sm:space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.document_notifications}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        document_notifications: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-fcc-blue-600 focus:ring-fcc-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                      <span className="text-sm sm:text-base">Documents</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 sm:space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.system_notifications}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        system_notifications: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-fcc-blue-600 focus:ring-fcc-blue-500"
                    />
                    <div className="flex items-center space-x-2">
                      <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                      <span className="text-sm sm:text-base">System Updates</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6 sm:mt-8">
              <Button 
                variant="outline" 
                onClick={() => setShowSettings(false)}
                className="text-sm sm:text-base"
                size="sm"
              >
                Cancel
              </Button>
              <Button 
                className="bg-red-100 border border-red-600 text-red-700 hover:bg-red-200 text-sm sm:text-base" 
                onClick={updatePreferences}
                size="sm"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </MainLayout>
  );
}
