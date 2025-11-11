"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export function useNotificationAlerts() {
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());

  useEffect(() => {
    // Check for new notifications every 30 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/notifications?limit=5`);
        if (response.ok) {
          const notifications = await response.json();
          
          // Show toast for new unread notifications
          notifications.forEach((notification: any) => {
            if (!notification.isRead && new Date(notification.date) > lastCheckTime) {
              showNotificationToast(notification);
            }
          });

          setLastCheckTime(new Date());
        }
      } catch (error) {
        console.error("Error checking for new notifications:", error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [lastCheckTime]);

  const showNotificationToast = (notification: any) => {
    const isEvent = notification.type === "event";
    const emoji = isEvent ? "📅" : "📢";
    const typeText = isEvent ? "New Event" : "New Announcement";
    
    toast(
      `${emoji} ${typeText}: ${notification.title}\n${notification.description}`,
      {
        duration: 6000,
        position: "top-right",
        style: {
          background: isEvent ? "#dbeafe" : "#fed7aa",
          border: isEvent ? "1px solid #3b82f6" : "1px solid #f97316",
          color: isEvent ? "#1e40af" : "#ea580c",
        },
      }
    );
  };

  return { showNotificationToast };
}

// Hook for manual notification triggering
export function useManualNotification() {
  const showSuccess = (title: string, message: string) => {
    toast.success(`✅ ${title}: ${message}`, {
      duration: 4000,
      position: "top-right",
    });
  };

  const showEvent = (title: string, message: string) => {
    toast(`📅 New Event Created: ${title}\n${message}`, {
      duration: 6000,
      position: "top-right",
      style: {
        background: "#dbeafe",
        border: "1px solid #3b82f6",
        color: "#1e40af",
      },
    });
  };

  const showAnnouncement = (title: string, message: string) => {
    toast(`📢 New Announcement Created: ${title}\n${message}`, {
      duration: 6000,
      position: "top-right",
      style: {
        background: "#fed7aa",
        border: "1px solid #f97316",
        color: "#ea580c",
      },
    });
  };

  return { showSuccess, showEvent, showAnnouncement };
}
