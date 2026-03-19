import AsyncStorage from "@react-native-async-storage/async-storage";

export const NOTIFICATIONS_STORAGE_KEY = "@inself/notifications";

export type NotificationType =
  | "emotional_checkin"
  | "reflection"
  | "checkout"
  | "challenge_phase"
  | "badge"
  | "reminder";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string; // ISO
  read: boolean;
  payload?: {
    challengeName?: string;
    phase?: number;
    totalPhases?: number;
    badgeName?: string;
  };
};

export async function loadNotifications(): Promise<AppNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AppNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveNotifications(list: AppNotification[]): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
}

export function generateNotificationId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
