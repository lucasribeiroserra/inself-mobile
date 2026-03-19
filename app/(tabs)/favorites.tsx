import React, { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useReflectionsRefresh } from "@/contexts/ReflectionsContext";
import { darkColors } from "@/lib/themeDark";
import { getFavorites, toggleFavorite, translateReflectionEntryForLanguage, type ReflectionEntry } from "@/lib/reflectionHistory";
import { useSettings } from "@/contexts/SettingsContext";

function hasJourney(entry: ReflectionEntry) {
  return (
    entry.answers.identifique?.trim() ||
    entry.answers.aceite?.trim() ||
    entry.answers.aja?.trim()
  );
}

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark } = useTheme();
  const { language } = useSettings();
  const { refreshTrigger, refreshReflections } = useReflectionsRefresh();
  const iconPrimary = isDark ? darkColors.primary : "#5A7A66";
  const iconMuted = isDark ? darkColors.mutedForeground : "#D1D5DB";
  const iconFg = isDark ? darkColors.foreground : "#1f2937";
  const [favorites, setFavorites] = useState<ReflectionEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    const f = await getFavorites();
    setFavorites(Array.isArray(f) ? f : []);
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

  const handleUnfavorite = async (e: { stopPropagation: () => void }, id: string) => {
    e.stopPropagation();
    await toggleFavorite(id);
    refreshReflections();
    load();
  };

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <View
        className="flex-row items-center border-b border-border dark:border-dark-border bg-background dark:bg-dark-bg px-4"
        style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}
      >
        <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-xl bg-card dark:bg-dark-card items-center justify-center mr-3">
          <MaterialCommunityIcons name="chevron-left" size={20} color={iconFg} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-serif font-semibold text-foreground dark:text-dark-fg">
            {language === "en" ? "Favorites" : "Favoritos"}
          </Text>
          <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg">
            {language === "en"
              ? `${favorites.length} saved reflection${favorites.length === 1 ? "" : "s"}`
              : `${favorites.length} reflexão(ões) salva(s)`}
          </Text>
        </View>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 25,
          paddingBottom: 120,
        }}
      >
        {favorites.length === 0 ? (
          <View className="items-center py-16">
            <MaterialCommunityIcons name="book-open" size={40} color={iconMuted} />
            <Text className="text-base font-serif text-foreground dark:text-dark-fg mt-4 mb-1">
              {language === "en" ? "No favorites yet" : "Nenhum favorito ainda"}
            </Text>
            <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg text-center">
              {language === "en"
                ? "Complete today's journey and tap Save on the Home screen to keep it in Favorites."
                : "Finalize a jornada do dia e toque em Salvar na home para guardar nos favoritos."}
            </Text>
          </View>
        ) : (
          <View className="gap-5">
            {favorites.map((f) => {
              const translated = translateReflectionEntryForLanguage(f, language);
              const expanded = expandedId === f.id;
              const showJourney = hasJourney(translated);
              return (
                <Pressable
                  key={f.id}
                  onPress={() => (showJourney ? setExpandedId(expanded ? null : f.id) : undefined)}
                  className="bg-card dark:bg-dark-card rounded-3xl p-6"
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <Text className="text-[12px] uppercase tracking-[0.2em] text-secondary dark:text-dark-muted-fg font-semibold">
                      {format(
                        new Date(f.date),
                        language === "en" ? "d MMMM" : "d 'de' MMMM",
                        { locale: language === "en" ? enUS : ptBR }
                      )}
                    </Text>
                    <Pressable onPress={(e) => handleUnfavorite(e, f.id)} hitSlop={8}>
                      <MaterialCommunityIcons name="heart" size={14} color={iconPrimary} />
                    </Pressable>
                  </View>
                  <Text className="text-base font-serif text-foreground dark:text-dark-fg leading-relaxed mb-3">
                    {translated.message}
                  </Text>
                  <View className="w-8 h-px bg-border dark:bg-dark-border mb-3" />
                  <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg italic leading-relaxed mb-1">
                    "{translated.quote}"
                  </Text>
                  <Text className="text-xs text-muted-foreground/60 dark:text-dark-muted-fg/60 uppercase tracking-wide mb-3">
                    — {translated.author}
                  </Text>
                  {translated.firstPrompt ? (
                    <View className="bg-primary/5 dark:bg-dark-primary/5 rounded-xl p-3 mb-3">
                      <Text className="text-[12px] uppercase tracking-wider text-primary dark:text-dark-primary font-semibold mb-1">
                        {language === "en" ? "Reflection" : "Reflexão"}
                      </Text>
                      <Text className="text-sm text-foreground dark:text-dark-fg leading-relaxed">
                        {translated.firstPrompt}
                      </Text>
                    </View>
                  ) : null}
                  {showJourney && expanded && (
                    <View className="gap-2 mt-2 pt-3 border-t border-border dark:border-dark-border">
                      {[
                        { label: language === "en" ? "Identify" : "Identifique", value: f.answers.identifique },
                        { label: language === "en" ? "Accept" : "Aceite", value: f.answers.aceite },
                        { label: language === "en" ? "Act" : "Aja", value: f.answers.aja },
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
                  {showJourney && (
                    <View className="flex-row items-center gap-1 mt-2">
                      <MaterialCommunityIcons name="chevron-down" size={14} color={iconMuted} />
                      <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg">
                        {expanded
                          ? language === "en"
                            ? "Hide journey"
                            : "Ocultar jornada"
                          : language === "en"
                            ? "View reflection journey"
                            : "Ver jornada de reflexão"}
                      </Text>
                    </View>
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
