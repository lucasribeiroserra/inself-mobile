import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Badge } from "./badges";
import type { AppLanguage, ReflectionCategory, VirtueId } from "./dailyReflections";
import { getDailyReflectionByCategoryVirtue } from "./dailyReflections";
import { apiFetch, isApiConfigured } from "./api";

export interface ReflectionEntry {
  id: string;
  date: string;
  message: string;
  quote: string;
  author: string;
  firstPrompt?: string | null;
  answers: {
    identifique: string;
    aceite: string;
    aja: string;
  };
  checkinCount: number;
  badgeEarned: Badge | null;
  favorited: boolean;
  category?: ReflectionCategory;
  virtue?: VirtueId;
  /** Emoção do check-out emocional no mesmo dia da reflexão */
  checkoutEmotion?: { slug: string; label: string } | null;
}

const STORAGE_KEY = "reflectionHistory";

export function translateReflectionEntryForLanguage(entry: ReflectionEntry, language: AppLanguage): ReflectionEntry {
  if (language === "pt") return entry;
  if (!entry.category || !entry.virtue) return entry;
  const translated = getDailyReflectionByCategoryVirtue(entry.category, entry.virtue, language);
  return {
    ...entry,
    message: translated.message,
    quote: translated.quote,
    author: translated.author,
    firstPrompt: translated.steps.identifique ?? null,
  };
}

function normalizeReflectionEntry(row: unknown): ReflectionEntry {
  const r = row as Record<string, unknown>;
  const date = r.date != null ? String(r.date) : r.completed_at != null ? String(r.completed_at) : new Date().toISOString();
  const answers = (r.answers as Record<string, string>) || {};
  return {
    id: String(r.id ?? ""),
    date,
    message: String(r.message ?? ""),
    quote: String(r.quote ?? ""),
    author: String(r.author ?? ""),
    firstPrompt: r.firstPrompt != null ? String(r.firstPrompt) : r.first_prompt != null ? String(r.first_prompt) : null,
    answers: {
      identifique: String(answers.identifique ?? ""),
      aceite: String(answers.aceite ?? ""),
      aja: String(answers.aja ?? ""),
    },
    checkinCount: typeof r.checkinCount === "number" ? r.checkinCount : Number(r.checkin_count_at_time) || 0,
    badgeEarned: (r.badgeEarned as ReflectionEntry["badgeEarned"]) ?? null,
    favorited: Boolean(r.favorited),
    category: (r.category as ReflectionEntry["category"]) ?? undefined,
    virtue: (r.virtue as ReflectionEntry["virtue"]) ?? undefined,
    checkoutEmotion:
      r.checkoutEmotion && typeof (r.checkoutEmotion as any).label === "string"
        ? { slug: String((r.checkoutEmotion as any).slug), label: String((r.checkoutEmotion as any).label) }
        : undefined,
  };
}

export const getReflectionHistory = async (): Promise<ReflectionEntry[]> => {
  if (isApiConfigured()) {
    const { data } = await apiFetch<ReflectionEntry[]>("/reflections");
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeReflectionEntry);
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export type SaveReflectionInput = Omit<ReflectionEntry, "id" | "favorited"> & { firstPrompt?: string | null };

export const saveReflection = async (entry: SaveReflectionInput): Promise<ReflectionEntry> => {
  if (isApiConfigured()) {
    const { data, error } = await apiFetch<{
      id: string;
      checkinCount: number;
      badgeEarned: Badge | null;
    }>("/reflections", {
      method: "POST",
      body: {
        message: entry.message,
        quote: entry.quote,
        author: entry.author,
        first_prompt: entry.firstPrompt ?? null,
        answers: entry.answers,
        category_slug: entry.category ?? null,
        virtue_slug: entry.virtue ?? null,
      },
    });
    if (error || !data) throw new Error(error ?? "Falha ao salvar reflexão");
    return {
      ...entry,
      id: data.id,
      checkinCount: data.checkinCount,
      badgeEarned: data.badgeEarned ?? null,
      favorited: false,
    };
  }
  const history = await getReflectionHistory();
  const newEntry: ReflectionEntry = {
    ...entry,
    id: crypto.randomUUID?.() ?? `ref-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    favorited: false,
  };
  history.unshift(newEntry);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return newEntry;
};

export const toggleFavorite = async (id: string): Promise<boolean> => {
  if (isApiConfigured()) {
    const { data } = await apiFetch<{ favorited: boolean }>(`/reflections/${id}/favorite`, { method: "POST" });
    return data?.favorited ?? false;
  }
  const history = await getReflectionHistory();
  const entry = history.find((e) => e.id === id);
  if (!entry) return false;
  entry.favorited = !entry.favorited;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return entry.favorited;
};

export const getFavorites = async (): Promise<ReflectionEntry[]> => {
  if (isApiConfigured()) {
    const { data } = await apiFetch<ReflectionEntry[]>("/favorites");
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeReflectionEntry);
  }
  const history = await getReflectionHistory();
  return history.filter((e) => e.favorited);
};
