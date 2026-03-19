import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { darkColors } from "@/lib/themeDark";
import { useSettings } from "@/contexts/SettingsContext";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export const FINAL_EMOTIONS: { id: "better" | "same" | "worse"; label: string; iconName: IconName }[] = [
  { id: "better", label: "Melhor", iconName: "trending-up" },
  { id: "same", label: "Igual", iconName: "arrow-right" },
  { id: "worse", label: "Pior", iconName: "trending-down" },
];

export type FinalEmotion = (typeof FINAL_EMOTIONS)[number]["id"];

interface EmotionalCheckOutProps {
  onSelect: (emotion: FinalEmotion) => void;
}

export default function EmotionalCheckOut({ onSelect }: EmotionalCheckOutProps) {
  const { isDark } = useTheme();
  const { language } = useSettings();
  const [selected, setSelected] = useState<FinalEmotion | null>(null);
  const iconPrimary = isDark ? darkColors.primary : "#5A7A66";
  const iconOnPrimary = isDark ? darkColors.primaryForeground : "#F5F0E8";

  const getFinalEmotionLabel = (emotionId: FinalEmotion) => {
    if (language !== "en") return FINAL_EMOTIONS.find((e) => e.id === emotionId)?.label ?? emotionId;
    const en: Record<FinalEmotion, string> = {
      better: "Better",
      same: "Same",
      worse: "Worse",
    };
    return en[emotionId] ?? emotionId;
  };

  return (
    <View>
      <Text className="text-[12px] uppercase tracking-[0.2em] text-primary dark:text-dark-primary font-semibold mb-2">
        {language === "en" ? "Emotional check-out" : "Check-out Emocional"}
      </Text>
      <Text className="text-base font-serif text-foreground dark:text-dark-fg leading-relaxed mb-5">
        {language === "en" ? "How do you feel " : "Como você se sente "}
        <Text className="text-primary dark:text-dark-primary">{language === "en" ? "right now?" : "agora?"}</Text>
      </Text>

      <View className="flex-row gap-2.5 mb-5">
        {FINAL_EMOTIONS.map((emotion) => {
          const isSelected = selected === emotion.id;
          return (
            <Pressable
              key={emotion.id}
              onPress={() => setSelected(emotion.id)}
              className={`flex-1 items-center gap-2 p-4 rounded-2xl border ${
                isSelected
                  ? "bg-primary/10 border-primary dark:bg-dark-primary/10 dark:border-dark-primary"
                  : "bg-background/60 border-border dark:bg-dark-bg/60 dark:border-dark-border"
              }`}
            >
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  isSelected ? "bg-primary dark:bg-dark-primary" : "bg-primary/15 dark:bg-dark-primary/15"
                }`}
              >
                <MaterialCommunityIcons
                  name={emotion.iconName}
                  size={20}
                  color={isSelected ? iconOnPrimary : iconPrimary}
                />
              </View>
              <Text
                className={`text-xs font-medium ${isSelected ? "text-primary dark:text-dark-primary" : "text-foreground dark:text-dark-fg"}`}
              >
                {getFinalEmotionLabel(emotion.id)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => selected && onSelect(selected)}
        disabled={!selected}
        className="flex-row items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary dark:bg-dark-primary"
      >
        <MaterialCommunityIcons name="check-circle" size={14} color={iconOnPrimary} />
        <Text className="text-sm font-medium text-primary-foreground dark:text-dark-primary-fg">
          {language === "en" ? "Finish" : "Concluir"}
        </Text>
      </Pressable>
    </View>
  );
}
