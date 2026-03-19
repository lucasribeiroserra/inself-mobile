import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import type { AppLanguage } from "@/lib/dailyReflections";

// Comportamento quando o app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const DAILY_REMINDER_CHANNEL_ID = "daily_reminder";

export async function registerForPushNotificationsAsync(language: AppLanguage = "pt"): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    if (finalStatus !== "granted") return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(DAILY_REMINDER_CHANNEL_ID, {
      name: language === "en" ? "Daily reflection" : "Reflexão diária",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });
  }

  const raw =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { eas?: { projectId?: string } }).easConfig?.projectId;
  const projectId = typeof raw === "string" && raw.length > 0 ? raw : null;
  if (!projectId) {
    if (__DEV__) {
      console.warn(
        "[Push] Para receber notificações: rode 'npx eas init', coloque o projectId em app.json (expo.extra.eas.projectId) e reinicie o app."
      );
    }
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data ?? null;
}
