/**
 * Ícones: navbar (Lucide) e demais (MaterialCommunityIcons / @expo/vector-icons).
 */

import type { ComponentType } from "react";
import { Home, Clock, Swords, Sparkles, User } from "lucide-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/** Ícones da bottom nav (tabs) – permanecem Lucide */
export const NAV_ICONS = {
  Home,
  Clock,
  Swords,
  Sparkles,
  User,
} as const;

const createEmotionIcon =
  (name: React.ComponentProps<typeof MaterialCommunityIcons>["name"]) =>
  ({ size = 24, color = "#000" }: { size?: number; color?: string }) =>
    <MaterialCommunityIcons name={name} size={size} color={color} />;

/** Ícones do check-in emocional (MaterialCommunityIcons) */
export const EMOTION_ICONS: Record<
  string,
  ComponentType<{ size?: number; color?: string; strokeWidth?: number }>
> = {
  anxious: createEmotionIcon("lightning-bolt"),
  stressed: createEmotionIcon("fire"),
  confused: createEmotionIcon("help-circle"),
  unmotivated: createEmotionIcon("battery"),
  calm: createEmotionIcon("leaf"),
  confident: createEmotionIcon("shield"),
  "seeking-self-love": createEmotionIcon("heart"),
  "seeking-discipline": createEmotionIcon("target"),
};

export type EmotionId = keyof typeof EMOTION_ICONS;
