"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const MessageNotification = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/messages");
      if (response.ok) {
        const data = await response.json();
        const totalUnread = data.conversations?.reduce(
          (total: number, conv: any) => total + (conv.unreadCount || 0), 
          0
        ) || 0;
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error("Error fetching unread message count:", error);
    }
  };

  return (
    <Link href="/messages" className="relative">
      <div className="p-2 rounded-full hover:bg-gray-100 transition-colors">
        <Image src="/message.png" alt="Messages" width={20} height={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>
    </Link>
  );
};

export default MessageNotification;
