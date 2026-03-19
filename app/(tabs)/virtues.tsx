import { View, Text, ScrollView } from "react-native";
import { VIRTUES } from "@/lib/virtues";
import { useTheme } from "@/contexts/ThemeContext";
import { darkColors } from "@/lib/themeDark";
import TopHeader from "@/components/TopHeader";
import AppIcon from "@/components/AppIcon";

export default function VirtuesScreen() {
  const { isDark } = useTheme();
  const iconPrimary = isDark ? darkColors.primary : "#5A7A66";
  const virtuePoints: Record<string, number> = {};
  const totalPoints = Object.values(virtuePoints).reduce((a, b) => a + b, 0);
  const level = Math.floor(totalPoints / 50) + 1;

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
        <Text className="text-2xl font-serif font-semibold text-foreground dark:text-dark-fg">Virtudes</Text>
        <Text className="text-sm text-muted-foreground dark:text-dark-muted-fg mt-1 mb-6">
          Seu caminho para a excelência moral
        </Text>

        <View className="mt-6 mb-6 bg-card dark:bg-dark-card rounded-3xl p-5 items-center">
          <Text className="text-[12px] uppercase tracking-[0.2em] text-primary dark:text-dark-primary font-semibold mb-2">
            Nível InSelf
          </Text>
          <Text className="text-4xl font-serif font-bold text-foreground dark:text-dark-fg mb-1">{level}</Text>
          <View className="h-1.5 bg-muted dark:bg-dark-muted rounded-full w-[200px] overflow-hidden">
            <View
              className="h-full bg-primary dark:bg-dark-primary rounded-full"
              style={{ width: `${Math.min((totalPoints % 50) / 50 * 100, 100)}%` }}
            />
          </View>
          <Text className="text-[12px] text-muted-foreground dark:text-dark-muted-fg mt-1.5">
            {totalPoints % 50}/50 para o próximo nível
          </Text>
        </View>

        <View className="gap-3">
          {VIRTUES.map((virtue) => {
            const points = virtuePoints[virtue.id] || 0;
            const pct = Math.min((points / virtue.maxPoints) * 100, 100);
            return (
              <View key={virtue.id} className="bg-card dark:bg-dark-card rounded-2xl p-4">
                <View className="flex-row items-center gap-3 mb-2">
                  <AppIcon name={virtue.icon as any} size="xl" color={iconPrimary} />
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-foreground dark:text-dark-fg">{virtue.name}</Text>
                      <Text className="text-[12px] text-muted-foreground dark:text-dark-muted-fg font-medium">
                        {points}/{virtue.maxPoints}
                      </Text>
                    </View>
                    <Text className="text-[12px] text-muted-foreground dark:text-dark-muted-fg">{virtue.description}</Text>
                  </View>
                </View>
                <View className="h-2 bg-muted dark:bg-dark-muted rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary dark:bg-dark-primary rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {totalPoints === 0 && (
          <Text className="text-center text-sm text-muted-foreground dark:text-dark-muted-fg py-8">
            Complete reflexões e desafios para desenvolver suas virtudes.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
