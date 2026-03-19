import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  loadNotifications,
  saveNotifications,
  generateNotificationId,
  type AppNotification,
  type NotificationType,
} from "@/lib/notificationsStorage";

type NotificationsContextType = {
  notifications: AppNotification[];
  hasUnread: boolean;
  refreshNotifications: () => Promise<void>;
  addNotification: (params: {
    type: NotificationType;
    title: string;
    message: string;
    payload?: AppNotification["payload"];
  }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  hasUnread: false,
  refreshNotifications: async () => {},
  addNotification: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
});

export const useNotifications = () => useContext(NotificationsContext);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refreshNotifications = useCallback(async () => {
    const list = await loadNotifications();
    setNotifications(list);
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const hasUnread = notifications.some((n) => !n.read);

  const addNotification = useCallback(
    async (params: { type: NotificationType; title: string; message: string; payload?: AppNotification["payload"] }) => {
      const item: AppNotification = {
        id: generateNotificationId(),
        type: params.type,
        title: params.title,
        message: params.message,
        created_at: new Date().toISOString(),
        read: false,
        payload: params.payload,
      };
      const next = [item, ...notifications];
      setNotifications(next);
      await saveNotifications(next);
    },
    [notifications]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      const next = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
      setNotifications(next);
      await saveNotifications(next);
    },
    [notifications]
  );

  const markAllAsRead = useCallback(async () => {
    const next = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(next);
    await saveNotifications(next);
  }, [notifications]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        hasUnread,
        refreshNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
