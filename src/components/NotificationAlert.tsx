'use client';

import { toast } from 'react-hot-toast';
import { useEffect, useState } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export default function NotificationAlert() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [processedNotifications, setProcessedNotifications] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Polling for new notifications
  useEffect(() => {
    // Don't start polling immediately - give some time for login processes to complete
    const initialDelay = setTimeout(() => {
      setIsInitialized(true);
      // Initial fetch
      fetchNotifications();

      // Set up polling every 10 seconds
      const interval = setInterval(fetchNotifications, 10000);

      return () => clearInterval(interval);
    }, 3000); // Wait 3 seconds before starting notification polling

    return () => clearTimeout(initialDelay);
  }, []);

  useEffect(() => {
    // Only show toast notifications after initialization to avoid conflicts with login toasts
    if (!isInitialized) return;
    
    // Show toast notifications for unread notifications
    notifications.forEach((notification: Notification) => {
      if (!notification.read && !processedNotifications.has(notification.id)) {
        // Show toast notification
        toast(
          (t) => (
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">{notification.title}</div>
              <div className="text-xs text-gray-600">{notification.message}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    markAsRead(notification.id);
                    toast.dismiss(t.id);
                  }}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Mark as Read
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ),
          {
            duration: 8000,
            position: 'top-right',
            style: {
              background: '#ffffff',
              color: '#1f2937',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
              minWidth: '300px',
            },
          }
        );

        // Mark as processed
        setProcessedNotifications(prev => new Set([...Array.from(prev), notification.id]));
      }
    });
  }, [notifications, processedNotifications, isInitialized]);

  return null; // This component doesn't render anything visible
}
