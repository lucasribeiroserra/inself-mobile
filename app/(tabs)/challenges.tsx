import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CHALLENGES, getDifficultyLabel, getDifficultyColor } from "@/lib/challenges";
import { useTheme } from "@/contexts/ThemeContext";
import { darkColors } from "@/lib/themeDark";
import TopHeader from "@/components/TopHeader";
import AppIcon from "@/components/AppIcon";
import { useSettings } from "@/contexts/SettingsContext";

export default function ChallengesScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { language } = useSettings();
  const iconPrimary = isDark ? darkColors.primary : "#5A7A66";
  const iconMuted = isDark ? darkColors.mutedForeground : "#6B7280";

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <TopHeader />
      <ScrollView
        contentContainerStyle={{
          paddingTop: 25,
          paddingHorizontal: 24,
          paddingBottom: 120,
        }}
      >
        <Text className="text-2xl font-serif font-semibold text-foreground dark:text-dark-fg">
          {language === "en" ? "Challenges" : "Desafios"}
        </Text>
        <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg mt-1 mb-6">
          {language === "en"
            ? "Philosophical challenges to strengthen your daily practice."
            : "Desafios filosóficos para fortalecer sua prática diária."}
        </Text>

        <View className="gap-4">
          {CHALLENGES.map((challenge) => (
            <Pressable
              key={challenge.id}
              onPress={() => router.push(`/challenges/${challenge.id}`)}
              className="bg-card dark:bg-dark-card rounded-3xl p-5"
            >
              <View className="flex-row items-start gap-4">
                <AppIcon name={challenge.icon as any} size="3xl" color={iconPrimary} />
                <View className="flex-1">
                  <Text className="text-base font-serif font-semibold text-foreground dark:text-dark-fg mb-1">
                    {language === "en" ? challenge.titleEn : challenge.title}
                  </Text>
                  <Text className="text-xs text-muted-foreground dark:text-dark-muted-fg leading-relaxed mb-3">
                    {language === "en" ? challenge.descriptionEn : challenge.description}
                  </Text>
                  <View className="flex-row flex-wrap gap-2 mb-4">
                    <View className="flex-row items-center gap-1 px-2 py-1 rounded-full bg-muted dark:bg-dark-muted">
                      <MaterialCommunityIcons name="clock-outline" size={10} color={iconMuted} />
                      <Text className="text-[12px] text-muted-foreground dark:text-dark-muted-fg">
                        {challenge.duration} {language === "en" ? "days" : "dias"}
                      </Text>
                    </View>
                    <View
                      className={`flex-row items-center gap-1 px-2 py-1 rounded-full ${getDifficultyColor(challenge.difficulty)}`}
                    >
                      <MaterialCommunityIcons name="lightning-bolt" size={10} color={iconMuted} />
                      <Text className="text-[12px] text-muted-foreground dark:text-dark-muted-fg">
                        {getDifficultyLabel(challenge.difficulty, language)}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm font-medium text-primary dark:text-dark-primary">
                    {language === "en" ? "Start challenge" : "Iniciar desafio"}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
