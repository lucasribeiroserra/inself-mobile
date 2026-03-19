import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, isApiConfigured } from "./api";

export type InitialEmotionSlug =
  | "anxious"
  | "stressed"
  | "confused"
  | "unmotivated"
  | "calm"
  | "confident"
  | "seeking-self-love"
  | "seeking-discipline";
type FinalEmotionSlug = "better" | "same" | "worse";

const EMOTIONAL_CHECKIN_STORAGE_KEY = "emotionalCheckinToday";
const EMOTION_LABELS: Record<InitialEmotionSlug, string> = {
  anxious: "Ansioso(a)",
  stressed: "Estressado(a)",
  confused: "Confuso(a)",
  unmotivated: "Desmotivado(a)",
  calm: "Calmo(a)",
  confident: "Confiante",
  "seeking-self-love": "Buscando amor-próprio",
  "seeking-discipline": "Buscando disciplina",
};

/** Data de hoje no fuso local (YYYY-MM-DD) para evitar divergência com o servidor. */
function getLocalTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Check-in emocional: um por dia. Retorna a emoção de hoje se existir (API ou armazenamento local). */
export async function getTodayCheckin(): Promise<{ emotion_slug: InitialEmotionSlug; label: string } | null> {
  const todayStr = getLocalTodayStr();
  if (isApiConfigured()) {
    const { data, error } = await apiFetch<{ emotion_slug: string; label: string }>(`/emotional-checkin/today?date=${todayStr}`);
    if (error || !data?.emotion_slug) return null;
    return { emotion_slug: data.emotion_slug as InitialEmotionSlug, label: data.label ?? EMOTION_LABELS[data.emotion_slug as InitialEmotionSlug] ?? "" };
  }
  try {
    const raw = await AsyncStorage.getItem(EMOTIONAL_CHECKIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { date: string; emotion_slug: string };
    if (parsed.date !== todayStr || !parsed.emotion_slug) return null;
    const slug = parsed.emotion_slug as InitialEmotionSlug;
    return { emotion_slug: slug, label: EMOTION_LABELS[slug] ?? slug };
  } catch {
    return null;
  }
}

export async function saveEmotionalCheckin(emotionSlug: InitialEmotionSlug): Promise<void> {
  const todayStr = getLocalTodayStr();
  if (isApiConfigured()) {
    await apiFetch("/emotional-checkin", { method: "POST", body: { emotion_slug: emotionSlug, date: todayStr } });
    return;
  }
  try {
    await AsyncStorage.setItem(EMOTIONAL_CHECKIN_STORAGE_KEY, JSON.stringify({ date: todayStr, emotion_slug: emotionSlug }));
  } catch {
    // ignore
  }
}

export async function saveEmotionalCheckout(
  emotionSlug: FinalEmotionSlug,
  _reflectionSessionId?: string | null
): Promise<void> {
  if (!isApiConfigured()) return;
  await apiFetch("/emotional-checkout", { method: "POST", body: { emotion_slug: emotionSlug } });
}
