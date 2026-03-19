import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useSettings } from "@/contexts/SettingsContext";

/**
 * Quando uma push notification é recebida, persiste na central in-app e atualiza hasUnread.
 * Deve ser montado dentro de NotificationsProvider.
 */
export function NotificationReceivedListener() {
  const { addNotification } = useNotifications();
  const { language } = useSettings();
  const addRef = useRef(addNotification);
  addRef.current = addNotification;
  const subscriptionRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    subscriptionRef.current = Notifications.addNotificationReceivedListener((notification) => {
      const title = (notification.request.content.title as string) || (language === "en" ? "Notification" : "Notificação");
      const body = (notification.request.content.body as string) || "";
      addRef.current({
        type: "reminder",
        title,
        message: body,
      });
    });
    return () => {
      if (subscriptionRef.current) {
        Notifications.removeNotificationSubscription(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []);

  return null;
}
