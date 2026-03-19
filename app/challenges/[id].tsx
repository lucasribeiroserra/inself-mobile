import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CHALLENGES } from "@/lib/challenges";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { darkColors } from "@/lib/themeDark";
import AppIcon from "@/components/AppIcon";
import { useSettings } from "@/contexts/SettingsContext";

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { language } = useSettings();
  const iconPrimary = isDark ? darkColors.primary : "#5A7A66";
  const iconMuted = isDark ? darkColors.mutedForeground : "#6B7280";
  const iconOnPrimary = isDark ? darkColors.primaryForeground : "#F5F0E8";
  const iconFg = isDark ? darkColors.foreground : "#1f2937";
  const placeholderColor = isDark ? darkColors.mutedForeground : "#9CA3AF";
  const challenge = CHALLENGES.find((c) => c.id === id);
  const { addNotification } = useNotifications();

  const [currentDay, setCurrentDay] = useState(1);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [answer, setAnswer] = useState("");

  if (!challenge) {
    return (
      <View className="flex-1 bg-background dark:bg-dark-bg items-center justify-center p-6">
        <Text className="text-foreground dark:text-dark-fg">
          {language === "en" ? "Challenge not found." : "Desafio não encontrado."}
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary dark:text-dark-primary font-medium">{language === "en" ? "Back" : "Voltar"}</Text>
        </Pressable>
      </View>
    );
  }

  const dayInfo = challenge.days.find((d) => d.day === currentDay);
  const isLastDay = currentDay === challenge.duration;
  const progress = (completedDays.length / challenge.duration) * 100;

  const handleCompleteDay = () => {
    setCompletedDays((prev) => [...prev, currentDay]);
    setAnswer("");
    addNotification({
      type: "challenge_phase",
      title:
        language === "en"
          ? `Phase ${currentDay} of ${challenge.duration} of the ${challenge.titleEn} completed`
          : `Fase ${currentDay} de ${challenge.duration} do desafio ${challenge.title} realizado`,
      message: language === "en" ? `Day ${currentDay} completed.` : `Dia ${currentDay} concluído.`,
      payload: { challengeName: challenge.title, phase: currentDay, totalPhases: challenge.duration },
    });
    if (isLastDay) {
      router.back();
    } else {
      setCurrentDay((d) => d + 1);
    }
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
        <Text className="text-lg font-serif font-semibold text-foreground dark:text-dark-fg flex-1" numberOfLines={1}>
          {language === "en" ? challenge.titleEn : challenge.title}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 25,
          paddingBottom: 120,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center gap-3 mb-6">
          <AppIcon name={challenge.icon as any} size="4xl" color={iconPrimary} />
          <View className="flex-1">
            <Text className="text-base font-serif font-semibold text-foreground dark:text-dark-fg">
              {language === "en" ? challenge.titleEn : challenge.title}
            </Text>
            <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg">
              {language === "en"
                ? `Day ${currentDay} of ${challenge.duration}`
                : `Dia ${currentDay} de ${challenge.duration}`}
            </Text>
          </View>
        </View>

        <View className="h-2 bg-muted dark:bg-dark-muted rounded-full overflow-hidden mb-8">
          <View
            className="h-full bg-primary dark:bg-dark-primary rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>

        {dayInfo && (
          <View className="bg-card dark:bg-dark-card rounded-2xl p-5 mb-6">
            <Text className="text-[12px] uppercase tracking-[0.2em] text-primary dark:text-dark-primary font-semibold mb-2">
              {language === "en" ? `Day ${currentDay} reflection` : `Reflexão do dia ${currentDay}`}
            </Text>
            <Text className="text-base font-serif text-foreground dark:text-dark-fg leading-relaxed mb-4">
              {language === "en" ? dayInfo.promptEn : dayInfo.prompt}
            </Text>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder={language === "en" ? "Write your reflection..." : "Escreva sua reflexão..."}
              placeholderTextColor={placeholderColor}
              multiline
              numberOfLines={4}
              className="w-full bg-background dark:bg-dark-muted border border-border dark:border-dark-border rounded-xl px-4 py-3 text-sm text-foreground dark:text-dark-fg mb-4"
              textAlignVertical="top"
            />
            <Pressable
              onPress={handleCompleteDay}
              disabled={!answer.trim()}
              className={`flex-row items-center justify-center gap-2 py-2.5 rounded-full ${
                answer.trim() ? "bg-primary dark:bg-dark-primary" : "bg-muted dark:bg-dark-muted"
              }`}
            >
              <MaterialCommunityIcons name="check-circle" size={14} color={answer.trim() ? iconOnPrimary : iconMuted} />
              <Text
                className={`text-sm font-medium ${
                  answer.trim() ? "text-primary-foreground dark:text-dark-primary-fg" : "text-muted-foreground dark:text-dark-muted-fg"
                }`}
              >
                {isLastDay
                  ? language === "en"
                    ? "Complete challenge"
                    : "Concluir desafio"
                  : language === "en"
                    ? "Complete day"
                    : "Concluir dia"}
              </Text>
              {!isLastDay && <MaterialCommunityIcons name="chevron-right" size={14} color={answer.trim() ? iconOnPrimary : iconMuted} />}
            </Pressable>
          </View>
        )}

        <View className="gap-2">
          {challenge.days.map((d) => (
            <View
              key={d.day}
              className={`flex-row items-center gap-3 p-3 rounded-xl ${
                d.day === currentDay ? "bg-primary/10 dark:bg-dark-primary/10 border border-primary dark:border-dark-primary" : "bg-card dark:bg-dark-card"
              }`}
            >
              {completedDays.includes(d.day) ? (
                <MaterialCommunityIcons name="check-circle" size={20} color={iconPrimary} />
              ) : (
                <View className="w-6 h-6 rounded-full bg-muted dark:bg-dark-muted items-center justify-center">
                  <Text className="text-[12px] font-semibold text-muted-foreground dark:text-dark-muted-fg">{d.day}</Text>
                </View>
              )}
              <Text
                className={`flex-1 text-sm ${
                  d.day === currentDay ? "font-medium text-foreground dark:text-dark-fg" : "text-muted-foreground dark:text-dark-muted-fg"
                }`}
                numberOfLines={2}
              >
                {language === "en" ? d.promptEn : d.prompt}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
