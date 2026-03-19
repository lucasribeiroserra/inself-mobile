import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { registerForPushNotificationsAsync } from "@/lib/registerPushNotifications";

/**
 * Quando o usuário está logado, pede permissão, obtém o token Expo Push e envia ao backend.
 * Deve ser montado dentro de AuthProvider e SettingsProvider.
 */
export function PushNotificationRegistration() {
  const { user } = useAuth();
  const { updatePushToken, language } = useSettings();
  const sentRef = useRef(false);

  useEffect(() => {
    if (!user) {
      sentRef.current = false;
      return;
    }
    let cancelled = false;
    (async () => {
      const token = await registerForPushNotificationsAsync(language);
      if (cancelled) return;
      if (token && !sentRef.current) {
        sentRef.current = true;
        await updatePushToken(token);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, updatePushToken]);

  return null;
}
