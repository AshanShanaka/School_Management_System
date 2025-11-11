"use client";

import { useNotificationAlerts } from "@/hooks/useNotificationAlerts";

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Initialize notification checking
  useNotificationAlerts();

  return <>{children}</>;
}
