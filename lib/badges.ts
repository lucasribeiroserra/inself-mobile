import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, isApiConfigured } from "./api";

export interface Badge {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  descriptionEn?: string;
  requiredCheckins: number;
  icon: string;
}

export const BADGES: Badge[] = [
  {
    id: "desperto",
    name: "Desperto",
    nameEn: "Awake",
    description: "Completou sua primeira reflexão",
    descriptionEn: "Completed your first reflection",
    requiredCheckins: 1,
    icon: "sprout",
  },
  {
    id: "atento",
    name: "Atento",
    nameEn: "Attentive",
    description: "3 dias de reflexão",
    descriptionEn: "3 days of reflection",
    requiredCheckins: 3,
    icon: "eye",
  },
  {
    id: "discipulo",
    name: "Discípulo",
    nameEn: "Disciple",
    description: "7 dias de reflexão",
    descriptionEn: "7 days of reflection",
    requiredCheckins: 7,
    icon: "book-open",
  },
  {
    id: "estoico",
    name: "Estoico",
    nameEn: "Stoic",
    description: "15 dias de reflexão",
    descriptionEn: "15 days of reflection",
    requiredCheckins: 15,
    icon: "domain",
  },
  {
    id: "contemplador",
    name: "Contemplador",
    nameEn: "Contemplative",
    description: "30 dias de reflexão",
    descriptionEn: "30 days of reflection",
    requiredCheckins: 30,
    icon: "mirror",
  },
  {
    id: "estrategista",
    name: "Estrategista",
    nameEn: "Strategist",
    description: "60 dias de reflexão",
    descriptionEn: "60 days of reflection",
    requiredCheckins: 60,
    icon: "chess-knight",
  },
  {
    id: "sabio",
    name: "Sábio",
    nameEn: "Wise",
    description: "100 dias de reflexão",
    descriptionEn: "100 days of reflection",
    requiredCheckins: 100,
    icon: "star",
  },
  {
    id: "virtuoso",
    name: "Virtuoso",
    nameEn: "Virtuous",
    description: "150 dias de reflexão",
    descriptionEn: "150 days of reflection",
    requiredCheckins: 150,
    icon: "crown",
  },
];

function getBadgeById(badgeId: string): Badge | null {
  return BADGES.find((b) => b.id === badgeId) ?? null;
}

export type AppLanguage = "pt" | "en";

export function localizeBadge(badge: Badge, language: AppLanguage): Badge {
  if (language === "en") {
    return {
      ...badge,
      name: badge.nameEn ?? badge.name,
      description: badge.descriptionEn ?? badge.description,
    };
  }
  return badge;
}

export function localizeBadgeById(badgeId: string, language: AppLanguage): Badge | null {
  const base = getBadgeById(badgeId);
  if (!base) return null;
  return localizeBadge(base, language);
}

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

export const getCurrentBadge = (count: number, language: AppLanguage = "pt"): Badge | null => {
  const earned = BADGES.filter((b) => count >= b.requiredCheckins);
  return earned.length > 0 ? localizeBadge(earned[earned.length - 1], language) : null;
};

export const getNextBadge = (count: number, language: AppLanguage = "pt"): Badge | null => {
  const next = BADGES.find((b) => count < b.requiredCheckins) || null;
  return next ? localizeBadge(next, language) : null;
};

export const getEarnedBadges = (count: number, language: AppLanguage = "pt"): Badge[] => {
  return BADGES.filter((b) => count >= b.requiredCheckins).map((b) => localizeBadge(b, language));
};

export const didEarnNewBadge = (oldCount: number, newCount: number, language: AppLanguage = "pt"): Badge | null => {
  const oldBadges = getEarnedBadges(oldCount, language);
  const newBadges = getEarnedBadges(newCount, language);
  if (newBadges.length > oldBadges.length) {
    return newBadges[newBadges.length - 1];
  }
  return null;
};
