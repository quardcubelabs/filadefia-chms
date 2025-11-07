'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { EmptyState } from '@/components/ui';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/login';
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fcc-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Messages</h1>
        <div className="bg-white rounded-2xl p-12">
          <EmptyState
            icon={<MessageSquare className="h-16 w-16 text-gray-400" />}
            title="Messaging System Coming Soon"
            description="The messaging system is currently under development. You'll be able to send announcements and communicate with members here."
          />
        </div>
      </div>
    </div>
  );
}
