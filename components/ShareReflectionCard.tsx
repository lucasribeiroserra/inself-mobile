/**
 * Card de reflexão para compartilhar — mesmo layout da Home.
 * Cores conforme o tema (light/dark). Altura pelo conteúdo.
 */
import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { DailyReflection, AppLanguage } from "@/lib/dailyReflections";
import type { Virtue } from "@/lib/virtues";
import { getCategoryLabel, CATEGORY_ICONS } from "@/lib/dailyReflections";
import { darkColors } from "@/lib/themeDark";
import AppIcon from "./AppIcon";

const CARD_WIDTH = 800;

const LIGHT_COLORS = {
  background: "#F5F0E8",
  foreground: "#2C2E33",
  primary: "#5A7A66",
  muted: "#6B7280",
  mutedFg: "#6B7280",
  /* Citação = text-muted-foreground; autor = muted-foreground/70 (mesmo da Home) */
  quoteFg: "#6B7280",
  authorFg: "#6B7280",
  authorOpacity: 0.7,
  border: "#DDD6CC",
  card: "#F0EBE3",
};

const DARK_COLORS = {
  background: darkColors.background,
  foreground: darkColors.foreground,
  primary: darkColors.primary,
  muted: darkColors.mutedForeground,
  mutedFg: darkColors.mutedForeground,
  quoteFg: darkColors.foreground,
  authorFg: darkColors.mutedForeground,
  authorOpacity: 1,
  border: darkColors.border,
  card: darkColors.card,
};

export type ShareReflectionCardProps = {
  reflection: DailyReflection;
  virtue: Virtue | null;
  isDark: boolean;
  language?: AppLanguage;
};

export default function ShareReflectionCard({ reflection, virtue, isDark, language = "pt" }: ShareReflectionCardProps) {
  const styles = useMemo(
    () => createStyles(isDark ? DARK_COLORS : LIGHT_COLORS),
    [isDark]
  );
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const { quote, author, message, category, steps } = reflection;
  const firstPrompt = steps.identifique ?? steps.aceite ?? steps.aja ?? "";

  const messageParts = message.split(".").length > 1
    ? { first: message.split(".")[0].trim() + ". ", rest: message.split(".").slice(1).join(". ").trim() + "." }
    : (() => {
        const words = message.split(" ");
        const half = Math.ceil(words.length / 2);
        return { first: words.slice(0, half).join(" "), rest: words.slice(half).join(" ") };
      })();

  return (
    <View style={styles.root} collapsable={false}>
      <View style={styles.inner}>
        <Text style={styles.message}>
          <Text style={styles.messageFirst}>{messageParts.first}</Text>
          <Text style={styles.messagePrimary}> {messageParts.rest}</Text>
        </Text>

        <View style={styles.pillsRow}>
          <View style={styles.pillCard}>
            <AppIcon name={CATEGORY_ICONS[category] as any} size="base" color={colors.muted} />
            <Text style={styles.pillCardText}>{getCategoryLabel(category, language)}</Text>
          </View>
          {virtue && (
            <View style={styles.pillPrimary}>
              <AppIcon name={virtue.icon as any} size="base" color={colors.primary} />
              <Text style={styles.pillPrimaryText}>{virtue.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.line} />

        <View style={styles.quoteBlock}>
          <Text style={styles.quote}>"{quote}"</Text>
          <Text style={styles.author}>— {author}</Text>
        </View>

        <View style={styles.reflectionBox}>
          <Text style={styles.reflectionLabel}>{language === "en" ? "Reflection" : "Reflexão"}</Text>
          <Text style={styles.reflectionPrompt}>{firstPrompt}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {language === "en" ? "inself.app — Reflection & Self-Knowledge" : "inself.app — Reflexão & Autoconhecimento"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: typeof LIGHT_COLORS) {
  return StyleSheet.create({
    root: {
      width: CARD_WIDTH,
      backgroundColor: colors.background,
    },
    inner: {
      paddingHorizontal: 48,
      paddingTop: 56,
      paddingBottom: 40,
    },
    message: {
      fontFamily: "CormorantGaramond_600SemiBold",
      fontSize: 42,
      color: colors.foreground,
      lineHeight: 54,
      marginBottom: 24,
    },
    messageFirst: {
      color: colors.foreground,
    },
    messagePrimary: {
      color: colors.primary,
    },
    pillsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 24,
    },
    pillCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: colors.card,
    },
    pillCardText: {
      fontFamily: "DMSans_400Regular",
      fontSize: 26,
      color: colors.mutedFg,
    },
    pillPrimary: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: colors.primary + "1A",
    },
    pillPrimaryText: {
      fontFamily: "DMSans_500Medium",
      fontSize: 26,
      color: colors.primary,
    },
    line: {
      width: 48,
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 24,
    },
    quoteBlock: {
      marginBottom: 24,
    },
    quote: {
      fontFamily: "DMSans_400Regular",
      fontSize: 32,
      fontStyle: "italic",
      color: colors.quoteFg,
      lineHeight: 40,
      marginBottom: 8,
    },
    author: {
      fontFamily: "DMSans_400Regular",
      fontSize: 25,
      letterSpacing: 0.5,
      color: colors.authorFg,
      opacity: colors.authorOpacity,
      textTransform: "uppercase",
    },
    reflectionBox: {
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderRadius: 16,
      backgroundColor: colors.primary + "1A",
      borderWidth: 1,
      borderColor: colors.primary + "20",
      marginBottom: 28,
    },
    reflectionLabel: {
      fontFamily: "DMSans_500Medium",
      fontSize: 24,
      letterSpacing: 3,
      color: colors.primary,
      marginBottom: 12,
    },
    reflectionPrompt: {
      fontFamily: "CormorantGaramond_400Regular",
      fontSize: 32,
      color: colors.foreground,
      lineHeight: 40,
    },
    footer: {
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: "center",
    },
    footerText: {
      fontFamily: "DMSans_400Regular",
      fontSize: 25,
      letterSpacing: 2,
      color: colors.muted,
      textTransform: "lowercase",
    },
  });
}

export const SHARE_CARD_WIDTH = CARD_WIDTH;
