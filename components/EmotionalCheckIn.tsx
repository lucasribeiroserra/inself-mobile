import * as React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { EMOTION_ICONS } from "@/lib/icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/contexts/SettingsContext";
import { darkColors } from "@/lib/themeDark";

export const INITIAL_EMOTIONS = [
  { id: "anxious", label: "Ansioso(a)", icon: "anxious" },
  { id: "stressed", label: "Estressado(a)", icon: "stressed" },
  { id: "confused", label: "Confuso(a)", icon: "confused" },
  { id: "unmotivated", label: "Desmotivado(a)", icon: "unmotivated" },
  { id: "calm", label: "Calmo(a)", icon: "calm" },
  { id: "confident", label: "Confiante", icon: "confident" },
  { id: "seeking-self-love", label: "Buscando amor-próprio", icon: "seeking-self-love" },
  { id: "seeking-discipline", label: "Buscando disciplina", icon: "seeking-discipline" },
] as const;

export type InitialEmotion = (typeof INITIAL_EMOTIONS)[number]["id"];

const primaryColor = "#5A7A66";
const mutedColor = "#6B7280";

const IconForEmotion = ({ emotionId, selected, isDark }: { emotionId: string; selected?: boolean; isDark?: boolean }) => {
  const Icon = EMOTION_ICONS[emotionId as keyof typeof EMOTION_ICONS];
  if (!Icon) return null;
  const color = selected ? (isDark ? darkColors.primary : primaryColor) : (isDark ? darkColors.mutedForeground : mutedColor);
  return (
    <Icon
      size={18}
      color={color}
      strokeWidth={selected ? 2.2 : 1.5}
    />
  );
};

interface EmotionalCheckInProps {
  onSelect: (emotion: InitialEmotion) => void;
  onSkip: () => void;
  inline?: boolean;
}

export default function EmotionalCheckIn({
  onSelect,
  onSkip,
  inline = false,
}: EmotionalCheckInProps) {
  const { isDark } = useTheme();
  const { language } = useSettings();
  const [selected, setSelected] = React.useState<InitialEmotion | null>(null);
  const iconPrimary = isDark ? darkColors.primary : primaryColor;
  const iconOnPrimary = isDark ? darkColors.primaryForeground : "#F5F0E8";

  const getEmotionLabel = React.useCallback(
    (emotionId: InitialEmotion) => {
      if (language !== "en") return INITIAL_EMOTIONS.find((e) => e.id === emotionId)?.label;
      const en: Record<InitialEmotion, string> = {
        anxious: "Anxious",
        stressed: "Stressed",
        confused: "Confused",
        unmotivated: "Unmotivated",
        calm: "Calm",
        confident: "Confident",
        "seeking-self-love": "Seeking self-love",
        "seeking-discipline": "Seeking discipline",
      };
      return en[emotionId] ?? emotionId;
    },
    [language]
  );

  const content = (
    <>
      {!inline && (
        <Text className="text-[12px] uppercase tracking-[0.2em] text-primary dark:text-dark-primary font-semibold mb-3">
          {language === "en" ? "Emotional check-in" : "Check-in Emocional"}
        </Text>
      )}
      {!inline && (
        <Text className="text-2xl font-serif font-semibold text-foreground dark:text-dark-fg mb-8">
          {language === "en" ? "How are you feeling " : "Como você está se sentindo "}
          <Text className="text-primary dark:text-dark-primary">{language === "en" ? "right now?" : "agora?"}</Text>
        </Text>
      )}

      <View className="flex-row flex-wrap gap-2 mb-5">
        {INITIAL_EMOTIONS.map((emotion) => {
          const isSelected = selected === emotion.id;
          return (
            <Pressable
              key={emotion.id}
              onPress={() => setSelected(emotion.id)}
              className={`flex-row items-center gap-2 p-3 rounded-xl border ${
                isSelected
                  ? "bg-primary/10 border-primary dark:bg-dark-primary/10 dark:border-dark-primary"
                  : "bg-background/60 border-border dark:bg-dark-bg/60 dark:border-dark-border"
              }`}
              style={{ width: "48%" }}
            >
              <IconForEmotion emotionId={emotion.icon} selected={isSelected} isDark={isDark} />
              <Text
                className={`text-[13px] font-medium leading-tight flex-1 ${
                  isSelected ? "text-primary dark:text-dark-primary" : "text-foreground dark:text-dark-fg"
                }`}
              >
                {getEmotionLabel(emotion.id)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {selected && (
        <View className="flex-row items-center gap-2 mb-4">
          {(() => {
            const Icon = EMOTION_ICONS[selected as keyof typeof EMOTION_ICONS];
            if (!Icon) return null;
            return <Icon size={24} color={iconPrimary} strokeWidth={2} />;
          })()}
          <Text className="text-sm text-foreground dark:text-dark-fg">
            {selected ? getEmotionLabel(selected) : ""}
          </Text>
        </View>
      )}

      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => selected && onSelect(selected)}
          disabled={!selected}
          className="flex-1 flex-row items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary dark:bg-dark-primary"
        >
          <Text className="text-sm font-medium text-primary-foreground dark:text-dark-primary-fg">
            {language === "en" ? "Continue" : "Continuar"}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={14} color={iconOnPrimary} />
        </Pressable>
        <Pressable onPress={onSkip} className="px-3 py-2.5">
          <Text className="text-sm font-medium text-muted-foreground dark:text-dark-muted-fg">
            {language === "en" ? "Skip" : "Pular"}
          </Text>
        </Pressable>
      </View>
    </>
  );

  if (inline) {
    return (
      <View className="bg-card dark:bg-dark-card rounded-2xl p-4">
        {content}
      </View>
    );
  }

  return (
    <View className="min-h-screen bg-background dark:bg-dark-bg justify-center px-6">
      <View>{content}</View>
    </View>
  );
}
