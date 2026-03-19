import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, isApiConfigured } from "./api";

export interface Badge {
  id: string;
  name: string;
  description: string;
  requiredCheckins: number;
  icon: string;
}

export const BADGES: Badge[] = [
  { id: "desperto", name: "Desperto", description: "Completou sua primeira reflexão", requiredCheckins: 1, icon: "sprout" },
  { id: "atento", name: "Atento", description: "3 dias de reflexão", requiredCheckins: 3, icon: "eye" },
  { id: "discipulo", name: "Discípulo", description: "7 dias de reflexão", requiredCheckins: 7, icon: "book-open" },
  { id: "estoico", name: "Estoico", description: "15 dias de reflexão", requiredCheckins: 15, icon: "domain" },
  { id: "contemplador", name: "Contemplador", description: "30 dias de reflexão", requiredCheckins: 30, icon: "mirror" },
  { id: "estrategista", name: "Estrategista", description: "60 dias de reflexão", requiredCheckins: 60, icon: "chess-knight" },
  { id: "sabio", name: "Sábio", description: "100 dias de reflexão", requiredCheckins: 100, icon: "star" },
  { id: "virtuoso", name: "Virtuoso", description: "150 dias de reflexão", requiredCheckins: 150, icon: "crown" },
];

const CHECKINS_KEY = "reflectionCheckins";
const LAST_CHECKIN_KEY = "lastCheckinDate";

export const getCheckinCount = async (): Promise<number> => {
  if (isApiConfigured()) {
    const { data } = await apiFetch<{ count: number }>("/checkin-count");
    return data?.count ?? 0;
  }
  try {
    const v = await AsyncStorage.getItem(CHECKINS_KEY);
    return parseInt(v || "0", 10);
  } catch {
    return 0;
  }
};

export const getCheckinCountSync = (): number => {
  return 0;
};

export const incrementCheckin = async (): Promise<number> => {
  if (isApiConfigured()) {
    return getCheckinCount();
  }
  const today = new Date().toDateString();
  const lastCheckin = await AsyncStorage.getItem(LAST_CHECKIN_KEY);
  if (lastCheckin === today) return getCheckinCount();

  const current = await getCheckinCount();
  const newCount = current + 1;
  await AsyncStorage.setItem(CHECKINS_KEY, String(newCount));
  await AsyncStorage.setItem(LAST_CHECKIN_KEY, today);
  return newCount;
};

export const getCurrentBadge = (count: number): Badge | null => {
  const earned = BADGES.filter((b) => count >= b.requiredCheckins);
  return earned.length > 0 ? earned[earned.length - 1] : null;
};

export const getNextBadge = (count: number): Badge | null => {
  return BADGES.find((b) => count < b.requiredCheckins) || null;
};

export const getEarnedBadges = (count: number): Badge[] => {
  return BADGES.filter((b) => count >= b.requiredCheckins);
};

export const didEarnNewBadge = (oldCount: number, newCount: number): Badge | null => {
  const oldBadges = getEarnedBadges(oldCount);
  const newBadges = getEarnedBadges(newCount);
  if (newBadges.length > oldBadges.length) {
    return newBadges[newBadges.length - 1];
  }
  return null;
};
