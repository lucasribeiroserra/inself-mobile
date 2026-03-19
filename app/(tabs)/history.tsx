import React, { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useFocusEffect } from "expo-router";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getReflectionHistory,
  toggleFavorite,
  type ReflectionEntry,
  translateReflectionEntryForLanguage,
} from "@/lib/reflectionHistory";
import { useTheme } from "@/contexts/ThemeContext";
import { useReflectionsRefresh } from "@/contexts/ReflectionsContext";
import { darkColors } from "@/lib/themeDark";
import TopHeader from "@/components/TopHeader";
import { useSettings } from "@/contexts/SettingsContext";

const formatDayLabel = (dateStr: string, language: "pt" | "en"): string => {
  const date = new Date(dateStr);
  if (isToday(date)) return language === "en" ? "Today" : "Hoje";
  if (isYesterday(date)) return language === "en" ? "Yesterday" : "Ontem";
  const locale = language === "en" ? enUS : ptBR;
  return format(date, "EEEE", { locale }).replace(/^\w/, (c) => c.toUpperCase());
};

type Tab = "all" | "favorites";

export default function HistoryScreen() {
  const { isDark } = useTheme();
  const { language } = useSettings();
  const { refreshTrigger, refreshReflections } = useReflectionsRefresh();
  const [history, setHistory] = useState<ReflectionEntry[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const iconPrimary = isDark ? darkColors.primary : "#5A7A66";
  const iconMuted = isDark ? darkColors.mutedForeground : "#6B7280";
  const iconOnPrimary = isDark ? darkColors.primaryForeground : "#F5F0E8";

  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    const h = await getReflectionHistory();
    setHistory(Array.isArray(h) ? h : []);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleToggleFav = async (id: string) => {
    await toggleFavorite(id);
    refreshReflections();
    load();
  };

  const displayList = tab === "favorites" ? history.filter((e) => e.favorited) : history;

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <TopHeader />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{
          paddingTop: 25,
          paddingHorizontal: 24,
          paddingBottom: 120,
        }}
      >
        <Text className="text-2xl font-serif font-semibold text-foreground dark:text-dark-fg">
          {language === "en" ? "History" : "Histórico"}
        </Text>
        <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg mt-1">
          {language === "en" ? "Your daily reflection journey" : "Sua jornada de reflexões diárias"}
        </Text>

        <View className="flex-row gap-2 mt-4 mb-4">
          <Pressable
            onPress={() => setTab("all")}
            className={`px-4 py-2 rounded-full ${tab === "all" ? "bg-primary dark:bg-dark-primary" : "bg-card dark:bg-dark-card"}`}
          >
            <Text
              className={`text-sm font-medium ${
                tab === "all" ? "text-primary-foreground dark:text-dark-primary-fg" : "text-muted-foreground dark:text-dark-muted-fg"
              }`}
            >
              {language === "en" ? "All" : "Todas"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab("favorites")}
            className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full ${
              tab === "favorites" ? "bg-primary dark:bg-dark-primary" : "bg-card dark:bg-dark-card"
            }`}
          >
            <MaterialCommunityIcons
              name={tab === "favorites" ? "heart" : "heart-outline"}
              size={14}
              color={tab === "favorites" ? iconOnPrimary : iconMuted}
            />
            <Text
              className={`text-sm font-medium ${
                tab === "favorites" ? "text-primary-foreground dark:text-dark-primary-fg" : "text-muted-foreground dark:text-dark-muted-fg"
              }`}
            >
            {language === "en" ? "Favorites" : "Favoritas"}
            </Text>
          </Pressable>
        </View>

        {displayList.length === 0 ? (
          <View className="items-center py-16">
            <MaterialCommunityIcons name="book-open" size={40} color={iconMuted} />
            <Text className="text-base font-serif text-foreground dark:text-dark-fg mt-4 mb-1">
              {tab === "favorites"
                ? language === "en"
                  ? "No favorites yet"
                  : "Nenhum favorito ainda"
                : language === "en"
                  ? "No reflections yet"
                  : "Nenhuma reflexão ainda"}
            </Text>
            <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg text-center">
              {tab === "favorites"
                ? language === "en"
                  ? "Tap the heart on a reflection to save it here."
                  : "Toque no coração em uma reflexão para salvá-la aqui."
                : language === "en"
                  ? "Complete your first reflection journey to start your history."
                  : "Complete sua primeira jornada de reflexão para começar seu histórico."}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {displayList.map((entry) => {
              const translated = translateReflectionEntryForLanguage(entry, language);
              const isExp = expanded === entry.id;
              const hasJourney =
                translated.answers.identifique?.trim() ||
                translated.answers.aceite?.trim() ||
                translated.answers.aja?.trim();
              return (
                <Pressable
                  key={entry.id}
                  onPress={() => setExpanded(isExp ? null : entry.id)}
                  className="bg-card dark:bg-dark-card rounded-2xl p-4"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-[12px] uppercase tracking-wider text-muted-foreground dark:text-dark-muted-fg font-semibold">
                      {formatDayLabel(entry.date, language)} ·{" "}
                      {format(new Date(entry.date), "d MMM", { locale: language === "en" ? enUS : ptBR })}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleToggleFav(entry.id);
                        }}
                        className="p-2"
                      >
                        <MaterialCommunityIcons
                          name={entry.favorited ? "heart" : "heart-outline"}
                          size={14}
                          color={iconPrimary}
                        />
                      </Pressable>
                      <MaterialCommunityIcons
                        name={isExp ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={iconMuted}
                      />
                    </View>
                  </View>
                  <Text className="text-base font-serif text-foreground dark:text-dark-fg leading-relaxed" numberOfLines={isExp ? undefined : 2}>
                    {translated.message}
                  </Text>
                  <View className="mt-2">
                    <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg italic">"{translated.quote}"</Text>
                    <Text className="text-[12px] text-muted-foreground dark:text-dark-muted-fg mt-0.5">— {translated.author}</Text>
                  </View>
                  {translated.firstPrompt ? (
                    <View className="mt-2 bg-primary/5 dark:bg-dark-primary/5 rounded-xl p-2.5">
                      <Text className="text-[12px] uppercase tracking-wider text-primary dark:text-dark-primary font-semibold mb-0.5">
                        {language === "en" ? "Reflection" : "Reflexão"}
                      </Text>
                      <Text className="text-sm text-foreground dark:text-dark-fg leading-relaxed" numberOfLines={isExp ? undefined : 2}>
                        {translated.firstPrompt}
                      </Text>
                    </View>
                  ) : null}
                  {isExp && hasJourney && (
                    <View className="mt-3 pt-3 border-t border-border dark:border-dark-border gap-2">
                      {[
                        { label: language === "en" ? "Identify" : "Identifique", value: entry.answers.identifique },
                        { label: language === "en" ? "Accept" : "Aceite", value: entry.answers.aceite },
                        { label: language === "en" ? "Act" : "Aja", value: entry.answers.aja },
                      ].filter((s) => s.value?.trim()).map((step) => (
                        <View key={step.label} className="bg-muted/60 dark:bg-dark-muted/60 rounded-xl p-3">
                          <Text className="text-[12px] uppercase tracking-wider text-primary dark:text-dark-primary font-semibold mb-1">
                            {step.label}
                          </Text>
                          <Text className="text-sm text-foreground/80 dark:text-dark-fg/80 leading-relaxed">
                            {step.value}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {isExp && entry.checkoutEmotion && (
                    <View className="mt-3 pt-3 border-t border-border dark:border-dark-border">
                      <View className="bg-primary/10 dark:bg-dark-primary/10 rounded-xl p-3 flex-row items-center gap-2">
                        <MaterialCommunityIcons name="check-circle-outline" size={18} color={iconPrimary} />
                        <View>
                          <Text className="text-[12px] uppercase tracking-wider text-primary dark:text-dark-primary font-semibold">
                            {language === "en" ? "Emotional check-out" : "Check-out emocional"}
                          </Text>
                          <Text className="text-sm text-foreground dark:text-dark-fg">
                            {language === "en"
                              ? entry.checkoutEmotion.slug === "better"
                                ? "Better"
                                : entry.checkoutEmotion.slug === "same"
                                  ? "Same"
                                  : "Worse"
                              : entry.checkoutEmotion.label}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                  {hasJourney && !isExp && (
                    <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg mt-2">
                      {language === "en" ? "Tap to view your reflection journey" : "Toque para ver a jornada de reflexão"}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
