'use client';

import { useAuth } from '@/hooks/useAuth';
import { useDepartmentAccess } from '@/hooks/useDepartmentAccess';
import { useEffect, useState } from 'react';
import { EmptyState, Button, Card, Badge, Modal, Input, Select } from '@/components/ui';
import Sidebar from '@/components/Sidebar';
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
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  const { user, loading: authLoading } = useAuth();
  const { isDepartmentLeader, departmentId, departmentName } = useDepartmentAccess();
  const supabase = createClientComponentClient();
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
    if (user) {
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
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600 mt-1">
                  {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
          <div className="flex gap-3">
            {unreadCount > 0 && (
              <Button className="bg-red-100 border border-red-600 text-red-700 hover:bg-red-200" onClick={markAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
            <Button className="bg-red-100 border border-red-600 text-red-700 hover:bg-red-200" onClick={() => setShowSettings(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            {notifications.length > 0 && (
              <Button className="bg-red-100 border border-red-600 text-red-700 hover:bg-red-200" onClick={clearAllNotifications}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Department Access Notification */}
        {isDepartmentLeader && departmentName && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <h3 className="font-medium text-yellow-900">Department Notifications: {departmentName}</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  You'll receive notifications related to your department activities and system-wide announcements.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-red-300 focus:border-red-500 focus:ring-red-500 focus:ring-2 bg-red-50 focus:outline-none"
                />
              </div>
            </div>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
              options={[
                { value: "all", label: "All Notifications" },
                { value: "unread", label: "Unread Only" },
                { value: "read", label: "Read Only" }
              ]}
              className="border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50"
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
              className="border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50"
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fcc-blue-600 mx-auto"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12">
            <EmptyState
              icon={<Bell className="h-16 w-16 text-gray-400" />}
              title="No Notifications"
              description={searchTerm || filter !== 'all' || typeFilter !== 'all' 
                ? "No notifications match your current filters." 
                : "You're all caught up! No new notifications."}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card key={notification.id} className={`p-6 transition-all duration-200 ${
                !notification.read ? 'bg-blue-50 border-blue-200' : 'hover:shadow-md'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-2 rounded-full ${
                      !notification.read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`font-semibold ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                        <div className="flex items-center gap-2">
                          {notification.action_url && (
                            <Button 
                              size="sm"
                              className="bg-red-100 border border-red-600 text-red-700 hover:bg-red-200"
                              onClick={() => {
                                if (!notification.read) {
                                  markAsRead(notification.id);
                                }
                                window.location.href = notification.action_url!;
                              }}
                            >
                              View Details
                            </Button>
                          )}
                          {!notification.read && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
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
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Delivery Methods</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
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
                      <Volume2 className="w-4 h-4 text-gray-500" />
                      <span>Email Notifications</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
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
                      <Bell className="w-4 h-4 text-gray-500" />
                      <span>Push Notifications</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Notification Types</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
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
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      <span>Announcements</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
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
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>Events</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
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
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span>Finance</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
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
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>Member Updates</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
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
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span>Documents</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3">
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
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span>System Updates</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button className="bg-red-100 border border-red-600 text-red-700 hover:bg-red-200" onClick={updatePreferences}>
                Save Settings
              </Button>
            </div>
          </div>
        </Modal>
          </div>
        </div>
      </div>
    </div>
  );
}
